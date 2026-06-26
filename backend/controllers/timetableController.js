const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const getTimetable = async (req, res, next) => {
  try {
    const { class_id, day_of_week } = req.query;

    if (!class_id || !day_of_week) {
      return res.status(400).json({ error: 'class_id and day_of_week are required' });
    }

    const { data, error } = await supabase
      .from('Timetable')
      .select('*')
      .eq('class_id', class_id)
      .eq('day_of_week', day_of_week)
      .order('period_number', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data });

  } catch (error) {
    next(error);
  }
};

module.exports = { getTimetable };
