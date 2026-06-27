const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Get all classes handled by a specific teacher (via Timetable, Class Teacher, + provided handlingClasses)
router.post('/classes/teacher-handled', async (req, res, next) => {
  try {
    const { teacherId, handlingClasses = [] } = req.body;
    console.log('[classes/teacher-handled] teacherId:', teacherId);
    console.log('[classes/teacher-handled] handlingClasses type:', typeof handlingClasses, '| value:', JSON.stringify(handlingClasses));
    
    const classIds = new Set();

    // Add classes directly from the teacher's profile provided by the frontend
    // Use regex to extract UUIDs to make it 100% immune to stringification/JSON errors
    const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;
    const extractedUuids = JSON.stringify(handlingClasses).match(uuidRegex) || [];
    extractedUuids.forEach(c => classIds.add(c));

    // 1. Get the class where they are the registered class teacher
    const { data: ctData } = await supabase
      .from('Class')
      .select('id')
      .eq('teacher_id', teacherId);
      
    if (ctData) {
      ctData.forEach(c => classIds.add(c.id));
    }

    // 2. Also get extra classes from Timetable (other subjects they teach)
    const { data: timetableData } = await supabase
      .from('Timetable')
      .select('class_id')
      .eq('teacher_id', teacherId);

    if (timetableData) {
      timetableData.forEach(t => classIds.add(t.class_id));
    }

    if (classIds.size === 0) {
      return res.json({ classes: [] });
    }

    // 3. Fetch full details for all these unique class ids
    const { data: classesData, error: clsError } = await supabase
      .from('Class')
      .select('*')
      .in('id', Array.from(classIds))
      .order('name', { ascending: true });

    if (clsError) {
      return res.status(500).json({ error: clsError.message });
    }

    res.json({ classes: classesData || [] });
  } catch (error) {
    console.error('Unexpected error in teacher-handled:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});


// Get classes and students for a teacher
router.get('/teacher/:teacherId', async (req, res, next) => {
  try {
    const { teacherId } = req.params;

    // Fetch classes for the teacher
    const { data: classes, error: classError } = await supabase
      .from('Class')
      .select('*')
      .eq('teacher_id', teacherId);

    if (classError) {
      return res.status(500).json({ error: 'Failed to fetch classes' });
    }

    if (!classes || classes.length === 0) {
      return res.json({ classes: [], students: {} });
    }

    // Fetch students for these classes
    const classIds = classes.map(c => c.id);
    
    // We try to fetch from 'Student' and 'students'
    let students = [];
    
    const { data: stdData, error: stdError } = await supabase
      .from('Student')
      .select('*')
      .in('class_id', classIds);
      
    if (!stdError && stdData) {
      students = stdData;
    } else {
      const { data: lowerStdData, error: lowerStdError } = await supabase
        .from('students')
        .select('*')
        .in('class_id', classIds);
        
      if (!lowerStdError && lowerStdData) {
        students = lowerStdData;
      }
    }

    // Group students by class_id
    const studentsByClass = {};
    classIds.forEach(id => {
      studentsByClass[id] = students.filter(s => s.class_id === id).sort((a, b) => {
        // Sort by roll number if available, otherwise by name
        if (a.rollNo && b.rollNo) return a.rollNo.localeCompare(b.rollNo);
        if (a.roll_number && b.roll_number) return a.roll_number.localeCompare(b.roll_number);
        return a.name.localeCompare(b.name);
      });
    });

    res.json({
      classes,
      students: studentsByClass
    });
  } catch (error) {
    next(error);
  }
});

// Get attendance records for a specific class and date
router.get('/records/:classId/:date', async (req, res, next) => {
  try {
    const { classId, date } = req.params;
    const { data, error } = await supabase
      .from('Attendance')
      .select('*')
      .eq('class_id', classId)
      .eq('date', date);

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// Save or update attendance records
router.post('/records', async (req, res, next) => {
  try {
    const { classId, date, attendanceData } = req.body;
    
    // attendanceData is an array of { student_id, status }
    const records = attendanceData.map(record => ({
      student_id: record.student_id,
      class_id: classId,
      date: date,
      status: record.status
    }));

    // Upsert works if there is a unique constraint on (student_id, date, class_id)
    // If not, we might need to delete existing first, or just insert
    // Let's delete existing for this class & date to ensure clean insert, or use upsert if constraint exists.
    // Safest without knowing constraints: delete then insert
    await supabase
      .from('Attendance')
      .delete()
      .eq('class_id', classId)
      .eq('date', date);

    if (records.length > 0) {
      const { data, error } = await supabase
        .from('Attendance')
        .insert(records);

      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.json({ success: true, data });
    } else {
      res.json({ success: true, data: [] });
    }
  } catch (error) {
    next(error);
  }
});

// Get students grouped by class for ALL classes handled by a teacher (via Timetable, Class Teacher, + provided handlingClasses)
router.post('/students/teacher-handled', async (req, res, next) => {
  try {
    const { teacherId, handlingClasses = [] } = req.body;
    const classIds = new Set();

    // Add classes directly from the teacher's profile provided by the frontend
    // Use regex to extract UUIDs to make it 100% immune to stringification/JSON errors
    const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;
    const extractedUuids = JSON.stringify(handlingClasses).match(uuidRegex) || [];
    extractedUuids.forEach(c => classIds.add(c));

    // 1. Get classes where they are the registered class teacher
    const { data: ctData } = await supabase
      .from('Class')
      .select('id')
      .eq('teacher_id', teacherId);

    if (ctData) {
      ctData.forEach(c => classIds.add(c.id));
    }

    // 2. Also get extra classes from Timetable
    const { data: timetableData } = await supabase
      .from('Timetable')
      .select('class_id')
      .eq('teacher_id', teacherId);

    if (timetableData) {
      timetableData.forEach(t => classIds.add(t.class_id));
    }

    if (classIds.size === 0) {
      return res.json({ students: {} });
    }

    const idsArray = Array.from(classIds);

    // 4. Fetch students for all these classes
    let students = [];
    const { data: stdData, error: stdError } = await supabase
      .from('Student')
      .select('*')
      .in('class_id', idsArray);

    if (!stdError && stdData) {
      students = stdData;
    } else {
      const { data: lowerStdData, error: lowerStdError } = await supabase
        .from('students')
        .select('*')
        .in('class_id', idsArray);

      if (!lowerStdError && lowerStdData) {
        students = lowerStdData;
      }
    }

    // 5. Group students by class_id
    const studentsByClass = {};
    idsArray.forEach(id => {
      studentsByClass[id] = students.filter(s => s.class_id === id).sort((a, b) => {
        if (a.rollNo && b.rollNo) return a.rollNo.localeCompare(b.rollNo);
        if (a.roll_number && b.roll_number) return a.roll_number.localeCompare(b.roll_number);
        return a.name.localeCompare(b.name);
      });
    });

    res.json({ students: studentsByClass });
  } catch (error) {
    console.error('Error fetching teacher-handled students:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

module.exports = router;
