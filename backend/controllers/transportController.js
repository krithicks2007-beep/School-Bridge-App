const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const getStudentsWithTransport = async (req, res, next) => {
  try {
    const { class_id } = req.query;

    if (!class_id) {
      return res.status(400).json({ error: 'class_id is required' });
    }

    // Fetch all students for the given class
    const { data: students, error: studentError } = await supabase
      .from('Student')
      .select('id, name, reg_id, photo_url')
      .eq('class_id', class_id)
      .order('name');

    if (studentError) {
      return res.status(500).json({ error: studentError.message });
    }

    // Fetch transport details for these students
    const studentIds = students.map((s) => s.id);
    let transports = [];

    if (studentIds.length > 0) {
      const { data: transportData, error: transportError } = await supabase
        .from('Transport')
        .select('*')
        .in('student_id', studentIds);

      if (transportError) {
        return res.status(500).json({ error: transportError.message });
      }
      transports = transportData || [];
    }

    // Merge transport data into students
    const data = students.map((student) => {
      const transport = transports.find((t) => t.student_id === student.id);
      return {
        ...student,
        transport: transport || null,
      };
    });

    res.json({ data });
  } catch (error) {
    next(error);
  }
};

const upsertTransport = async (req, res, next) => {
  try {
    const { student_id } = req.params;
    const { driver_name, route_name, bus_number, pickup_stop, pickup_time, drop_time, driver_phone } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: 'student_id is required' });
    }

    // Check if transport record already exists
    const { data: existing, error: checkError } = await supabase
      .from('Transport')
      .select('id')
      .eq('student_id', student_id)
      .maybeSingle();

    let result;

    // Convert empty strings to null for PostgreSQL time and text columns
    const payload = {
      driver_name: driver_name || null,
      route_name: route_name || null,
      bus_number: bus_number || null,
      pickup_stop: pickup_stop || null,
      pickup_time: pickup_time || null,
      drop_time: drop_time || null,
      driver_phone: driver_phone || null,
    };

    if (existing) {
      // Update
      const { data, error } = await supabase
        .from('Transport')
        .update(payload)
        .eq('student_id', student_id)
        .select();

      if (error) return res.status(500).json({ error: error.message });
      result = data[0];
    } else {
      // Insert
      const { data, error } = await supabase
        .from('Transport')
        .insert({
          student_id,
          ...payload,
          status: 'Scheduled',
        })
        .select();

      if (error) return res.status(500).json({ error: error.message });
      result = data[0];
    }

    res.json({ data: result, message: 'Transport details saved successfully' });
  } catch (error) {
    next(error);
  }
};

const getStudentTransport = async (req, res, next) => {
  try {
    const { student_id } = req.params;
    if (!student_id) return res.status(400).json({ error: 'student_id is required' });

    const { data, error } = await supabase
      .from('Transport')
      .select('*')
      .eq('student_id', student_id)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });

    res.json({ data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudentsWithTransport,
  upsertTransport,
  getStudentTransport,
};
