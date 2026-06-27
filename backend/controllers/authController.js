const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const staffTables = ['Teacher', 'teachers', 'Staff', 'staff'];
const staffNameColumns = ['name', 'Name', 'teacher_name', 'staff_name'];
const staffEmailColumns = ['email', 'Email'];
const staffPasswordColumns = ['password', 'Password', 'pin', 'PIN', 'staff_password', 'teacher_password', 'staff_id'];
const userTables = ['User', 'users'];
const staffRoles = ['teacher', 'admin', 'staff'];

const normalizeRole = (role) => {
  const normalized = (role || 'teacher').toLowerCase();
  return normalized === 'staff' ? 'teacher' : normalized;
};

const stripPrivateStaffFields = (profile = {}) => {
  const { password, Password, password_hash, pin, PIN, staff_password, teacher_password, staff_id, ...safeProfile } = profile;
  return safeProfile;
};

const readFirstValue = (row = {}, columns = []) => {
  for (const column of columns) {
    if (row[column] !== undefined && row[column] !== null && row[column] !== '') {
      return row[column];
    }
  }

  return null;
};

const namesMatch = (storedName, inputName) => (
  String(storedName || '').trim().toLowerCase() === String(inputName || '').trim().toLowerCase()
);

const findStaffProfileByName = async (name) => {
  const trimmedName = name.trim();

  for (const table of staffTables) {
    for (const column of staffNameColumns) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .ilike(column, trimmedName)
        .limit(2);

      if (error) {
        console.log(`[staffLogin] ${table}.${column} name lookup failed:`, error.message);
        continue;
      }

      if (!data || data.length === 0) continue;

      const exactMatches = data.filter((row) => namesMatch(row[column], trimmedName));
      const matches = exactMatches.length ? exactMatches : data;

      if (matches.length > 1) {
        return { error: 'More than one staff record has this name. Please use a unique staff name.' };
      }

      console.log('[staffLogin] Found in table:', table, '| Columns:', Object.keys(matches[0]).join(', '));
      return { profile: matches[0], table };
    }
  }

  return { error: 'Staff not found. Check name and password.' };
};

const findUserProfile = async (client, userId) => {
  for (const table of userTables) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) return data;
    console.error(`[staffLogin] "${table}" table error:`, error?.message);
  }

  return null;
};

const findStaffProfileByEmail = async (client, email) => {
  if (!email) return null;

  for (const table of staffTables) {
    for (const column of staffEmailColumns) {
      const { data, error } = await client
        .from(table)
        .select('*')
        .eq(column, email)
        .single();

      if (!error && data) return data;
      console.log(`[staffLogin] ${table}.${column} email lookup failed:`, error?.message);
    }
  }

  return null;
};

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
    const { name, email, password } = req.body;

    if ((!name && !email) || !password) {
      return res.status(400).json({ error: 'Name and password are required.' });
    }

    const staffLookup = name ? await findStaffProfileByName(name) : {};
    if (staffLookup.error && !email) {
      return res.status(401).json({ error: staffLookup.error });
    }

    const staffEmail = email || readFirstValue(staffLookup.profile, staffEmailColumns);

    const loginWithStaffPassword = () => {
      const staffPassword = readFirstValue(staffLookup.profile, staffPasswordColumns);
      console.log('[staffLogin] Direct password check — stored:', JSON.stringify(staffPassword), '| entered:', JSON.stringify(password));

      if (!staffPassword || String(staffPassword).trim() !== String(password).trim()) {
        console.log('[staffLogin] Direct password mismatch — falling through.');
        return null;
      }

      const role = normalizeRole(staffLookup.profile.role);
      console.log('[staffLogin] Direct password matched! Role:', role);
      if (!staffRoles.includes(role)) {
        return { forbidden: true };
      }

      const safeProfile = stripPrivateStaffFields(staffLookup.profile);
      return {
        data: {
          user: { id: safeProfile.id, name: safeProfile.name },
          session: null,
          role,
          profile: { ...safeProfile, role },
        }
      };
    };

    const hasStaffPassword = Boolean(readFirstValue(staffLookup.profile, staffPasswordColumns));
    console.log('[staffLogin] Teacher found:', !!staffLookup.profile, '| has direct password:', hasStaffPassword, '| email:', staffEmail);

    if (hasStaffPassword) {
      const staffPasswordLogin = loginWithStaffPassword();
      if (staffPasswordLogin) {
        if (staffPasswordLogin.forbidden) {
          return res.status(403).json({ error: 'This account is not authorized for the staff portal.' });
        }
        return res.json(staffPasswordLogin);
      } else {
        // If it failed, don't fall through to Supabase Auth. Tell them the password doesn't match.
        return res.status(401).json({ error: 'Incorrect password for this staff member.' });
      }
    }

    if (!staffEmail) {
      return res.status(401).json({ error: 'Staff email not found for this name. Add email to the staff record or share the new auth schema.' });
    }

    // Step 1: Authenticate with Supabase Auth using the email mapped from the staff name.
    console.log('[staffLogin] Trying Supabase Auth with email:', staffEmail);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: staffEmail,
      password,
    });

    if (error) {
      console.log('[staffLogin] Supabase Auth failed:', error.message);
      return res.status(401).json({ error: error.message });
    }

    const userId = data.user.id;
    const accessToken = data.session.access_token;

    // Step 2: Use the user's own access token to query user profile
    // This respects RLS: the user can read their own row.
    const authedClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      {
        global: {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      }
    );

    const userData = await findUserProfile(authedClient, userId);

    if (!userData) {
      return res.status(404).json({
        error: 'User role not found. Make sure a row with your user ID exists in the User/users table.',
      });
    }

    const role = normalizeRole(userData.role);
    if (!staffRoles.includes(role)) {
      return res.status(403).json({ error: 'This account is not authorized for the staff portal.' });
    }

    // Step 3: Fetch staff profile (name, subject, etc.) from the staff table using email.
    const staffProfile = staffLookup.profile || await findStaffProfileByEmail(authedClient, data.user.email);

    // Merge User row + Teacher profile row
    const mergedProfile = { ...userData, ...stripPrivateStaffFields(staffProfile || {}) };

    console.log('[backend] Sending merged profile:', JSON.stringify(mergedProfile));
    res.json({ data: { user: data.user, session: data.session, role, profile: { ...mergedProfile, role } } });
  } catch (error) {
    next(error);
  }
};

module.exports = { parentLogin, staffLogin };
