const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const { createClient } = require('@supabase/supabase-js');
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


app.use('/api/students', require('./routes/students'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/attendance', require('./routes/attendance'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
