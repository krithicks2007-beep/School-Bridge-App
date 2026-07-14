const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const postHomework = async (req, res, next) => {
  try {
    const { class_id, teacher_id, subject, title, description, expires_at } = req.body;

    if (!class_id || !teacher_id || !title || !description) {
      return res.status(400).json({ error: 'Class ID, Teacher ID, title, and description are required.' });
    }

    const { data, error } = await supabase
      .from('Homework')
      .insert([{
        class_id,
        teacher_id,
        subject,
        title,
        description,
        due_date: expires_at || new Date().toISOString(),
        expires_at: expires_at || null
      }])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message: 'Homework posted successfully', data: data[0] });
  } catch (error) {
    next(error);
  }
};

const getClassHomework = async (req, res, next) => {
  try {
    const { class_id } = req.params;

    // Fetch homework where expires_at is null OR expires_at is in the future
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('Homework')
      .select('*, Teacher:teacher_id(name, subject)')
      .eq('class_id', class_id)
      .or(`expires_at.is.null,expires_at.gt.${now}`);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

const getTeacherHomework = async (req, res, next) => {
  try {
    const { teacher_id } = req.params;

    const { data, error } = await supabase
      .from('Homework')
      .select('*, Class:class_id(name, section)')
      .eq('teacher_id', teacher_id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

const updateHomework = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, expires_at } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Homework ID is required' });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (expires_at !== undefined) {
      updateData.expires_at = expires_at;
      if (expires_at) updateData.due_date = expires_at;
    }

    const { data, error } = await supabase
      .from('Homework')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ message: 'Homework updated successfully', data: data[0] });
  } catch (error) {
    next(error);
  }
};

const deleteHomework = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Homework ID is required' });
    }

    const { error } = await supabase
      .from('Homework')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ message: 'Homework deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { postHomework, getClassHomework, getTeacherHomework, updateHomework, deleteHomework };
