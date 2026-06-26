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

app.use('/api/students', require('./routes/students'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/timetable', require('./routes/timetable'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
