const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const login = async (req, res, next) => {
  try {
    const { reg_id, password } = req.body;

    if (!reg_id || !password) {
      return res.status(400).json({ error: 'reg_id and password are required.' });
    }

    // 1. Try to find in Student table
    const { data: student, error: studentError } = await supabase
      .from('Student')
      .select('*')
      .eq('reg_id', reg_id)
      .single();

    if (!studentError && student) {
      // Check password (assume column is 'password' or 'pin' just in case)
      if (student.password === password || student.pin === password) {
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

        return res.json({
          data: {
            ...student,
            class: classData || null,
            parentStudent: parentStudent || null,
            role: 'parent',
          }
        });
      } else {
        return res.status(401).json({ error: 'Incorrect password.' });
      }
    }

    // If Student table fails because relation doesn't exist, try 'students' (fallback as before)
    if (studentError && studentError.message && studentError.message.includes('does not exist')) {
      const { data: lowerStudent, error: lowerError } = await supabase
        .from('students')
        .select('*')
        .eq('reg_id', reg_id)
        .single();
        
      if (!lowerError && lowerStudent) {
        if (lowerStudent.password === password || lowerStudent.pin === password) {
          return res.json({
            data: {
              ...lowerStudent,
              role: 'parent',
            }
          });
        } else {
          return res.status(401).json({ error: 'Incorrect password.' });
        }
      }
    }

    // 2. Try Teacher/Staff/Admin tables
    const staffTables = ['Teacher', 'teachers', 'Staff', 'staff', 'Admin', 'admins'];
    for (const table of staffTables) {
      const { data: staff, error: staffError } = await supabase
        .from(table)
        .select('*')
        .eq('reg_id', reg_id)
        .single();
        
      if (!staffError && staff) {
        // For Admin table, use staff_id as the password. For others, try various password columns.
        const isAdminTable = table === 'Admin' || table === 'admins';
        const staffPassword = isAdminTable
          ? staff.staff_id
          : (staff.password || staff.Password || staff.staff_password || staff.teacher_password || staff.pin || staff.PIN || staff.staff_id);
        
        // 2a. Check direct password if it exists
        if (staffPassword && String(staffPassword).trim() === String(password).trim()) {
          // Determine role: Admin table always = 'admin', others read from column or default to 'teacher'
          let role;
          if (isAdminTable) {
            role = 'admin';
          } else {
            const rawRole = (staff.role || 'teacher').toLowerCase();
            role = rawRole === 'staff' ? 'teacher' : rawRole;
          }
          
          const { password: _p, Password: _P, pin: _pin, PIN: _PIN, staff_password, teacher_password, ...safeProfile } = staff;
          
          return res.json({
            data: {
              user: { id: safeProfile.id, name: safeProfile.name },
              session: null,
              role,
              profile: { ...safeProfile, role },
            }
          });
        }
        
        // 2b. If direct password fails or doesn't exist, try Supabase Auth using their email
        // (Not applicable for Admin table since it has no Supabase Auth account)
        if (isAdminTable) {
          return res.status(401).json({ error: 'Incorrect password.' });
        }

        const staffEmail = staff.email || staff.Email;
        if (!staffEmail) {
          return res.status(401).json({ error: 'Incorrect password.' }); // Or no email mapped
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: staffEmail,
          password,
        });

        if (authError) {
          return res.status(401).json({ error: 'Incorrect password.' });
        }

        const userId = authData.user.id;
        const accessToken = authData.session.access_token;

        const authedClient = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_KEY,
          {
            global: {
              headers: { Authorization: `Bearer ${accessToken}` },
            },
          }
        );

        let userData = null;
        for (const userTable of ['User', 'users']) {
          const { data: uData, error: uError } = await authedClient
            .from(userTable)
            .select('*')
            .eq('id', userId)
            .single();
          if (!uError && uData) {
            userData = uData;
            break;
          }
        }

        const userRole = (userData?.role || staff.role || 'teacher').toLowerCase();
        const normalizedRole = userRole === 'staff' ? 'teacher' : userRole;
        
        const mergedProfile = { ...(userData || {}), ...staff };
        const { password: _p2, Password: _P2, pin: _pin2, PIN: _PIN2, staff_password: _sp2, teacher_password: _tp2, ...safeProfile2 } = mergedProfile;

        return res.json({
          data: {
            user: authData.user,
            session: authData.session,
            role: normalizedRole,
            profile: { ...safeProfile2, role: normalizedRole }
          }
        });
      }
    }

    // If not found anywhere
    return res.status(404).json({ error: 'User not found with this reg_id.' });

  } catch (error) {
    next(error);
  }
};

module.exports = { login };
