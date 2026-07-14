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
    const { title, content, target_audience, author_id, expires_at } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const { data, error } = await supabase
      .from('Announcement')
      .insert([{ 
        title, 
        content, 
        target_audience: target_audience || 'all',
        author_id: author_id || null,
        expires_at: expires_at || null
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
    // and student announcements can be 'student:1,2,3'
    const orQuery = `target_audience.eq.all` 
      + (studentId ? `,target_audience.ilike.student:%` : '')
      + (classId ? `,target_audience.ilike.class:%` : '');

    const { data, error } = await supabase
      .from('Announcement')
      .select('*')
      .or(orQuery)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Filter class announcements precisely and filter out expired announcements
    const now = new Date();
    const filteredData = data.filter(ann => {
      // Expiry check
      if (ann.expires_at) {
        const expires = new Date(ann.expires_at);
        if (expires < now) return false;
      }

      if (ann.target_audience === 'all') return true;
      if (studentId && ann.target_audience.startsWith('student:')) {
        const students = ann.target_audience.replace('student:', '').split(',');
        return students.includes(String(studentId));
      }
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

const getSentAnnouncements = async (req, res, next) => {
  try {
    const { author_id } = req.params;
    
    if (!author_id) {
      return res.status(400).json({ error: 'Author ID is required' });
    }

    const { data, error } = await supabase
      .from('Announcement')
      .select('*')
      .eq('author_id', author_id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ announcements: data });
  } catch (error) {
    next(error);
  }
};

const updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, expires_at } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Announcement ID is required' });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (expires_at !== undefined) updateData.expires_at = expires_at;

    const { data, error } = await supabase
      .from('Announcement')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Announcement updated successfully', data: data[0] });
  } catch (error) {
    next(error);
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Announcement ID is required' });
    }

    const { error } = await supabase
      .from('Announcement')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  createAnnouncement,
  getAnnouncements,
  getSentAnnouncements,
  updateAnnouncement,
  deleteAnnouncement
};
