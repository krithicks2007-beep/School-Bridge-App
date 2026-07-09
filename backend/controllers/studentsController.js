const { createClient } = require('@supabase/supabase-js');
const cloudinary = require('cloudinary').v2;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadPhoto = async (req, res, next) => {
  try {
    const studentId = req.params.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const uploadStream = () => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'school_app/students' },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        stream.end(file.buffer);
      });
    };

    const result = await uploadStream();
    const url = result.secure_url;

    const { error: dbError } = await supabase
      .from('Student') // ensure case sensitivity matches frontend usage
      .update({ photo_url: url })
      .eq('id', studentId);

    if (dbError) {

      if (dbError.message && dbError.message.includes('relation "public.Student" does not exist')) {
        const { error: lowerDbError } = await supabase
          .from('students')
          .update({ photo_url: url })
          .eq('id', studentId);
          
        if (lowerDbError) {
          return res.status(500).json({ error: lowerDbError.message });
        }
      } else {
        return res.status(500).json({ error: dbError.message });
      }
    }

    res.json({ url, error: null });

  } catch (error) {
    next(error);
  }
};

const createStudent = async (req, res, next) => {
  try {
    const studentData = req.body;
    
    // Clean up empty strings to null for specific non-text fields
    if (studentData.date_of_birth === '') {
      studentData.date_of_birth = null;
    }
    if (studentData.class_id === '') {
      studentData.class_id = null;
    }

    if (!studentData.reg_id || !studentData.pin || !studentData.name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Ensure 'grade' is populated
    if (!studentData.grade && studentData.class_id) {
      const { data: classData } = await supabase
        .from('Class')
        .select('name')
        .eq('id', studentData.class_id)
        .single();
      if (classData) {
        studentData.grade = classData.name;
      }
    }

    const { data, error } = await supabase
      .from('Student')
      .insert([studentData])
      .select();

    if (error) {
      console.error('Supabase Student Insert Error:', error);
      if (error.code === '23505') {
        return res.status(409).json({ error: 'A student with this Registration ID or exact Name/PIN already exists in the database.' });
      }
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ data, error: null });
  } catch (error) {
    next(error);
  }
};

const searchStudents = async (req, res, next) => {
  try {
    const { q } = req.query;
    let query = supabase.from('Student').select('*, Class(name, section, Teacher!fk_class_teacher(name))');
    
    if (q) {
      query = query.or(`name.ilike.%${q}%,reg_id.ilike.%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
};

const getStudent = async (req, res, next) => {
  try {
    const studentId = req.params.id;

    const { data, error } = await supabase
      .from('Student')
      .select('*, Class(name, section, Teacher!fk_class_teacher(name))')
      .eq('id', studentId)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const studentId = req.params.id;
    const studentData = req.body;

    if (studentData.date_of_birth === '') {
      studentData.date_of_birth = null;
    }
    if (studentData.class_id === '') {
      studentData.class_id = null;
    }

    if (studentData.class_id) {
      const { data: classData } = await supabase
        .from('Class')
        .select('name')
        .eq('id', studentData.class_id)
        .single();

      if (classData) {
        studentData.grade = classData.name;
      }
    }

    const { data, error } = await supabase
      .from('Student')
      .update(studentData)
      .eq('id', studentId)
      .select('*, Class(name, section, Teacher!fk_class_teacher(name))')
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'A student with this Registration ID or exact Name/PIN already exists in the database.' });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json({ data, error: null });
  } catch (error) {
    next(error);
  }
};

const deleteStudent = async (req, res, next) => {
  try {
    const studentId = req.params.id;
    
    const { error } = await supabase
      .from('Student')
      .delete()
      .eq('id', studentId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, error: null });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadPhoto, createStudent, searchStudents, getStudent, updateStudent, deleteStudent };
