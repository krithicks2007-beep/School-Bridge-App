const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const saveMarks = async (req, res, next) => {
  try {
    const { exam_name, subject, class_id, max_marks, marks, date } = req.body;
    
    if (!exam_name || !subject || !marks || !Array.isArray(marks)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const marksData = [];
    
    // Process each student's mark
    for (const item of marks) {
      if (item.marks_obtained === undefined || item.marks_obtained === null || item.marks_obtained === '') continue;

      const { student_id, marks_obtained } = item;
      
      // Check if mark already exists for this student, exam, and subject
      const { data: existingMark } = await supabase
        .from('TestMark')
        .select('id')
        .eq('student_id', student_id)
        .eq('exam_name', exam_name)
        .eq('subject', subject)
        .single();
        
      if (existingMark) {
        // Update existing
        await supabase
          .from('TestMark')
          .update({
            marks_obtained: parseFloat(marks_obtained),
            max_marks: parseFloat(max_marks),
            date: date || new Date().toISOString()
          })
          .eq('id', existingMark.id);
      } else {
        // Insert new
        marksData.push({
          student_id,
          subject,
          exam_name,
          marks_obtained: parseFloat(marks_obtained),
          max_marks: parseFloat(max_marks),
          date: date || new Date().toISOString()
        });
      }
    }

    if (marksData.length > 0) {
      const { error } = await supabase
        .from('TestMark')
        .insert(marksData);
        
      if (error) {
        return res.status(500).json({ error: error.message });
      }
    }

    res.status(200).json({ success: true, message: 'Marks saved successfully' });
  } catch (error) {
    next(error);
  }
};

const getParentMarks = async (req, res, next) => {
  try {
    const { student_id } = req.params;
    
    if (!student_id) {
      return res.status(400).json({ error: 'Missing student_id' });
    }

    const { data, error } = await supabase
      .from('TestMark')
      .select('*')
      .eq('student_id', student_id)
      .order('date', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Group by exam_name
    const exams = {};
    data.forEach(mark => {
      if (!exams[mark.exam_name]) {
        exams[mark.exam_name] = {
          exam_name: mark.exam_name,
          date: mark.date,
          subjects: []
        };
      }
      exams[mark.exam_name].subjects.push(mark);
    });

    const result = Object.values(exams);
    result.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({ data: result, error: null });
  } catch (error) {
    next(error);
  }
};

const getTeacherMarks = async (req, res, next) => {
  try {
    const { exam_name, class_id, subject } = req.query;
    
    // First get all students in the class
    const { data: students, error: studentError } = await supabase
      .from('Student')
      .select('id, name, photo_url')
      .eq('class_id', class_id);
      
    if (studentError) {
      return res.status(500).json({ error: studentError.message });
    }

    // Then get marks for this exam and subject for these students
    const studentIds = students.map(s => s.id);
    let marksData = [];
    
    if (studentIds.length > 0) {
      const { data: marks, error: marksError } = await supabase
        .from('TestMark')
        .select('*')
        .in('student_id', studentIds)
        .eq('exam_name', exam_name)
        .eq('subject', subject);
        
      if (!marksError && marks) {
        marksData = marks;
      }
    }

    // Combine them
    const result = students.map(student => {
      const mark = marksData.find(m => m.student_id === student.id);
      return {
        ...student,
        marks_obtained: mark ? mark.marks_obtained : null,
        max_marks: mark ? mark.max_marks : null
      };
    });

    res.status(200).json({ data: result, error: null });
  } catch (error) {
    next(error);
  }
};

module.exports = { saveMarks, getParentMarks, getTeacherMarks };
