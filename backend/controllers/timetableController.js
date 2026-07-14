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

const getTeacherSchedule = async (req, res, next) => {
  try {
    const { teacherId, day_of_week, handlingClasses = [], teacherProfile = {} } = req.body;

    if (!teacherId) {
      return res.status(400).json({ error: 'teacherId is required' });
    }

    const classIds = new Set();
    const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;
    const extractedUuids = JSON.stringify(handlingClasses).match(uuidRegex) || [];
    extractedUuids.forEach(id => classIds.add(id));

    const { data: classTeacherData } = await supabase
      .from('Class')
      .select('id')
      .eq('teacher_id', teacherId);

    if (classTeacherData) {
      classTeacherData.forEach(cls => classIds.add(cls.id));
    }

    const { data: teacherTimetableData } = await supabase
      .from('Timetable')
      .select('class_id')
      .eq('teacher_id', teacherId);

    if (teacherTimetableData) {
      teacherTimetableData.forEach(row => classIds.add(row.class_id));
    }

    if (classIds.size === 0) {
      return res.json({ data: [], classes: [] });
    }

    const idsArray = Array.from(classIds);

    const { data: classesData, error: classesError } = await supabase
      .from('Class')
      .select('*')
      .in('id', idsArray);

    if (classesError) {
      return res.status(500).json({ error: classesError.message });
    }

    let query = supabase
      .from('Timetable')
      .select('*')
      .in('class_id', idsArray)
      .order('start_time', { ascending: true })
      .order('period_number', { ascending: true });

    if (day_of_week) {
      query = query.eq('day_of_week', day_of_week);
    }

    const { data: timetableData, error: timetableError } = await query;

    if (timetableError) {
      return res.status(500).json({ error: timetableError.message });
    }

    const normalize = value => String(value || '').trim().toLowerCase();
    const teacherCandidates = new Set([
      teacherId,
      teacherProfile.id,
      teacherProfile.reg_id,
      teacherProfile.staff_id,
      teacherProfile.email,
      teacherProfile.name,
    ].map(normalize).filter(Boolean));

    const matchingRows = (timetableData || []).filter(row => teacherCandidates.has(normalize(row.teacher_id)));
    const rowsToUse = matchingRows.length > 0 ? matchingRows : (timetableData || []);
    const classById = new Map((classesData || []).map(cls => [cls.id, cls]));

    const data = rowsToUse.map(row => {
      const cls = classById.get(row.class_id);
      return {
        ...row,
        subject: row.subject || row.subject_name,
        class_name: cls?.name || 'Class',
        class_section: cls?.section || '',
      };
    });

    res.json({ data, classes: classesData || [] });
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
      subject: row.subject || row.Subject || row.subject_name || row.Subject_name,
      teacher_id: row.teacher_id || row.Teacher || row.teacher,
      start_time: row.start_time || row.Start || row.start,
      end_time: row.end_time || row.End || row.end,
      room: row.room || row.Room,
      is_break: row.is_break || row.Is_break || row.Is_Break || false,
      break_label: row.break_label || row.Break_label || row.Break_Label
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

const getSubjectsByClass = async (req, res, next) => {
  try {
    const { class_id } = req.params;
    
    if (!class_id) {
      return res.status(400).json({ error: 'class_id is required' });
    }

    const { data, error } = await supabase
      .from('Timetable')
      .select('subject_name, subject')
      .eq('class_id', class_id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const subjects = new Set();
    data.forEach(row => {
      const subj = row.subject_name || row.subject;
      if (subj && subj.trim() !== '' && subj.toLowerCase() !== 'break' && subj.toLowerCase() !== 'lunch') {
        subjects.add(subj);
      }
    });

    res.json({ subjects: Array.from(subjects) });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTimetable, getTeacherSchedule, uploadTimetable, updateTimetableCell, getSubjectsByClass };
