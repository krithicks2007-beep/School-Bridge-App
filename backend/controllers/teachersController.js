const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const addTeacher = async (req, res, next) => {
  try {
    const { name, reg_id, staff_id, subject, email, phone, address, photo_url, class_teacher_of, handling_classes } = req.body;

    if (!name || !reg_id || !staff_id) {
      return res.status(400).json({ error: 'Name, Login ID (reg_id), and Password (staff_id) are required.' });
    }

    let authUserId = null;
    
    // Automatically create the Supabase Auth user securely on the backend
    const teacherEmail = email || `${reg_id.toLowerCase()}@school.local`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: teacherEmail,
      password: staff_id,
      email_confirm: true
    });

    if (authError) {
      return res.status(400).json({ error: `Auth Error: ${authError.message}` });
    }

    authUserId = authData.user.id;

    // Insert into the custom public.User table to satisfy the foreign key constraint
    const { error: userError } = await supabase
      .from('User')
      .insert([{
        id: authUserId,
        role: 'teacher',
        staff_id: staff_id,
        reg_id: reg_id
      }]);

    if (userError) {
      // If we fail here, the Auth user was created but DB insert failed. 
      // It's a partial failure, but we must return an error.
      return res.status(500).json({ error: `User Table Insert Error: ${userError.message}` });
    }

    const { data, error } = await supabase
      .from('Teacher')
      .insert([{
        user_id: authUserId,
        name,
        reg_id,
        staff_id,
        subject,
        email: email || null,
        phone,
        address,
        photo_url,
        class_teacher_of: class_teacher_of || null,
        handling_classes: handling_classes || []
      }])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message: 'Teacher added successfully', data: data[0] });
  } catch (error) {
    next(error);
  }
};

const getTeacher = async (req, res, next) => {
  try {
    const { reg_id } = req.params;

    const { data, error } = await supabase
      .from('Teacher')
      .select('*')
      .eq('reg_id', reg_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Teacher not found.' });
      }
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

const updateTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (updates.class_teacher_of === "") {
      updates.class_teacher_of = null;
    }

    const { data, error } = await supabase
      .from('Teacher')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: 'Teacher not found.' });
    }

    res.status(200).json({ message: 'Teacher updated successfully', data: data[0] });
  } catch (error) {
    next(error);
  }
};

const deleteTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('Teacher')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (data.length === 0) {
      return res.status(404).json({ error: 'Teacher not found.' });
    }

    res.status(200).json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const searchTeachers = async (req, res, next) => {
  try {
    const { q } = req.query;
    let query = supabase.from('Teacher').select('*');
    
    if (q) {
      query = query.or(`name.ilike.%${q}%,reg_id.ilike.%${q}%`);
    }
    
    const { data, error } = await query.order('name');
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

module.exports = { addTeacher, getTeacher, updateTeacher, deleteTeacher, searchTeachers };
