const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const getStudents = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('Student')
      .select('id, name, admission_number')
      .order('name');

    if (error) {
      // Fallback to lowercase 'students' just in case
      if (error.message && error.message.includes('relation "public.Student" does not exist')) {
        const { data: lowerData, error: lowerError } = await supabase
          .from('students')
          .select('id, name, admission_number')
          .order('name');
        
        if (lowerError) {
          return res.status(500).json({ error: lowerError.message });
        }
        return res.json({ students: lowerData });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json({ students: data });
  } catch (error) {
    next(error);
  }
};

const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, target_audience, author_id } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const { data, error } = await supabase
      .from('Announcement')
      .insert([{ 
        title, 
        content, 
        target_audience: target_audience || 'all',
        author_id: null 
      }])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message: 'Announcement created successfully', data: data[0] });
  } catch (error) {
    next(error);
  }
};

const getAnnouncements = async (req, res, next) => {
  try {
    const { studentId, classId } = req.query;
    
    // We fetch 'all', the specific student, and any class announcements to filter in memory
    // because class announcements can be a comma-separated list like 'class:1,2'
    const orQuery = `target_audience.eq.all` 
      + (studentId ? `,target_audience.eq.student:${studentId}` : '')
      + (classId ? `,target_audience.ilike.class:%` : '');

    const { data, error } = await supabase
      .from('Announcement')
      .select('*')
      .or(orQuery)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Filter class announcements precisely
    const filteredData = data.filter(ann => {
      if (ann.target_audience === 'all') return true;
      if (studentId && ann.target_audience === `student:${studentId}`) return true;
      if (classId && ann.target_audience.startsWith('class:')) {
        const classes = ann.target_audience.replace('class:', '').split(',');
        return classes.includes(String(classId));
      }
      return false;
    });

    res.json({ announcements: filteredData });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  createAnnouncement,
  getAnnouncements
};
