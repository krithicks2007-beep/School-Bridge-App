const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret_for_development', { expiresIn: '7d' });
};

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
        let classPromise = student.class_id ? supabase.from('Class').select('*').eq('id', student.class_id).single() : Promise.resolve({ data: null });
        let parentPromise = student.id ? supabase.from('ParentStudent').select('*').eq('student_id', student.id).single() : Promise.resolve({ data: null });

        const [classRes, parentRes] = await Promise.all([classPromise, parentPromise]);

        const token = generateToken({ id: student.id, role: 'parent', reg_id: student.reg_id });

        return res.json({
          data: {
            ...student,
            class: classRes.data || null,
            parentStudent: parentRes.data || null,
            role: 'parent',
            token
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
          const token = generateToken({ id: lowerStudent.id, role: 'parent', reg_id: lowerStudent.reg_id });
          return res.json({
            data: {
              ...lowerStudent,
              role: 'parent',
              token
            }
          });
        } else {
          return res.status(401).json({ error: 'Incorrect password.' });
        }
      }
    }

    // 2. Try Teacher/Staff/Admin tables in parallel
    const staffTables = ['Teacher', 'teachers', 'Staff', 'staff', 'Admin', 'admins'];
    const staffPromises = staffTables.map(table => 
      supabase.from(table).select('*').eq('reg_id', reg_id).single().then(res => ({ table, ...res }))
    );
    
    const staffResults = await Promise.all(staffPromises);
    
    for (const result of staffResults) {
      const { table, data: staff, error: staffError } = result;
        
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
          
          const token = generateToken({ id: safeProfile.id, role, reg_id: safeProfile.reg_id || safeProfile.staff_id });
          return res.json({
            data: {
              user: { id: safeProfile.id, name: safeProfile.name },
              session: null,
              role,
              profile: { ...safeProfile, role },
              token
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

        const token = generateToken({ id: authData.user.id, role: normalizedRole, reg_id: safeProfile2.reg_id || safeProfile2.staff_id });
        return res.json({
          data: {
            user: authData.user,
            session: authData.session,
            role: normalizedRole,
            profile: { ...safeProfile2, role: normalizedRole },
            token
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
