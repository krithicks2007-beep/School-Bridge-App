const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const { createClient } = require('@supabase/supabase-js');
const { verifyToken } = require('./middleware/authMiddleware');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

app.get('/health', async (req, res) => {
  try {
    await supabase.from('Student').select('id').limit(1);
    res.status(200).json({ status: 'ok', database: 'awake' });
  } catch (err) {
    res.status(200).json({ status: 'ok', database: 'error' });
  }
});

// Debug endpoint: lists ALL tables in the public schema
app.get('/debug/tables', async (req, res) => {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_type', 'BASE TABLE');

  if (error) {
    // Fallback: try each common name manually
    const results = {};
    for (const table of ['User', 'users', 'Staff', 'staff', 'Teacher', 'teachers', 'StaffProfile', 'TeacherProfile']) {
      const { data: d, error: e } = await supabase.from(table).select('id').limit(1);
      results[table] = e ? `ERROR: ${e.message}` : `OK (${d?.length ?? 0} rows visible)`;
    }
    return res.json({ note: 'information_schema failed, using manual check', results });
  }

  res.json({ tables: data?.map(r => r.table_name) });
});


const studentsRoutes = require('./routes/students');
const authRoutes = require('./routes/auth');
const teachersRoutes = require('./routes/teachers');
const announcementsRoutes = require('./routes/announcements');
const marksRoutes = require('./routes/marks');
const transportRoutes = require('./routes/transport');
const attendanceRoutes = require('./routes/attendance');
const timetableRoutes = require('./routes/timetable');
const homeworkRoutes = require('./routes/homework');

app.use('/api/auth', authRoutes);
app.use('/api/students', verifyToken, studentsRoutes);
app.use('/api/teachers', verifyToken, teachersRoutes);
app.use('/api/announcements', verifyToken, announcementsRoutes);
app.use('/api/marks', verifyToken, marksRoutes);
app.use('/api/transport', verifyToken, transportRoutes);
app.use('/api/attendance', verifyToken, attendanceRoutes);
app.use('/api/timetable', verifyToken, timetableRoutes);
app.use('/api/homework', verifyToken, homeworkRoutes);


// Classes endpoint for admin dropdowns
app.get('/api/classes', verifyToken, async (req, res) => {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data, error } = await supabase.from('Class').select('id, name, section, Teacher!fk_class_teacher(name)').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.stack });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
