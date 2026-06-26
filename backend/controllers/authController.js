const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const parentLogin = async (req, res, next) => {
  try {
    const { name, initial, pin } = req.body;

    let { data: student, error: studentError } = await supabase
      .from('Student')
      .select('*')
      .eq('name', name)
      .eq('initial', initial)
      .eq('pin', pin)
      .single();

    if (studentError || !student) {

      if (studentError && studentError.message && studentError.message.includes('relation "public.Student" does not exist')) {
        const { data: lowerStudent, error: lowerError } = await supabase
          .from('students')
          .select('*')
          .eq('name', name)
          .eq('initial', initial)
          .eq('pin', pin)
          .single();
          
        if (!lowerError && lowerStudent) {
          student = lowerStudent;
          studentError = null;
        }
      }
    }

    if (studentError || !student) {
      return res.status(401).json({ error: 'Student not found. Check name, initial and PIN.' });
    }

    let classData = null;
    if (student.class_id) {
      const { data } = await supabase
        .from('Class')
        .select('*')
        .eq('id', student.class_id)
        .single();
      classData = data;
    }

    let parentStudent = null;
    if (student.id) {
      const { data } = await supabase
        .from('ParentStudent')
        .select('*')
        .eq('student_id', student.id)
        .single();
      parentStudent = data;
    }

    res.json({
      data: {
        ...student,
        class: classData || null,
        parentStudent: parentStudent || null,
      }
    });

  } catch (error) {
    next(error);
  }
};

const staffLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return res.status(401).json({ error: error.message });

    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) return res.status(404).json({ error: 'User role not found.' });

    res.json({ data: { ...data, role: userData.role } });
  } catch (error) {
    next(error);
  }
};

module.exports = { parentLogin, staffLogin };
