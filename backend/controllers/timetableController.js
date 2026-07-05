const { createClient } = require('@supabase/supabase-js');
const xlsx = require('xlsx');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const getTimetable = async (req, res, next) => {
  try {
    const { class_id, day_of_week } = req.query;

    if (!class_id) {
      return res.status(400).json({ error: 'class_id is required' });
    }

    let query = supabase
      .from('Timetable')
      .select('*')
      .eq('class_id', class_id)
      .order('period_number', { ascending: true });

    if (day_of_week) {
      query = query.eq('day_of_week', day_of_week);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data });

  } catch (error) {
    next(error);
  }
};

const uploadTimetable = async (req, res, next) => {
  try {
    const { class_id } = req.body;
    if (!class_id) {
      return res.status(400).json({ error: 'class_id is required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Excel file is required' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const formattedData = data.map(row => ({
      class_id,
      day_of_week: row.day_of_week || row.Day || row.day,
      period_number: row.period_number || row.Period || row.period,
      subject_name: row.subject_name || row.Subject || row.subject,
      teacher_id: row.teacher_id || row.Teacher || row.teacher,
      start_time: row.start_time || row.Start || row.start,
      end_time: row.end_time || row.End || row.end
    }));

    // Delete existing timetable for this class and insert new
    await supabase.from('Timetable').delete().eq('class_id', class_id);
    const { data: insertedData, error } = await supabase.from('Timetable').insert(formattedData);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Timetable uploaded successfully', data: insertedData });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    next(error);
  }
};

const updateTimetableCell = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subject, teacher_id, start_time, end_time } = req.body;

    const updates = {};
    if (subject !== undefined) updates.subject = subject;
    if (teacher_id !== undefined) updates.teacher_id = teacher_id;
    if (start_time !== undefined) updates.start_time = start_time;
    if (end_time !== undefined) updates.end_time = end_time;

    const { data, error } = await supabase
      .from('Timetable')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data: data[0] });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTimetable, uploadTimetable, updateTimetableCell };
