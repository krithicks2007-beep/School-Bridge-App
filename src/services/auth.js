import { supabase } from './supabase'

export const parentLogin = async (name, initial, pin) => {

  // Step 1 — Find student
  const { data: student, error: studentError } = await supabase
    .from('Student')
    .select('*')
    .eq('name', name)
    .eq('initial', initial)
    .eq('pin', pin)
    .single()

  console.log('Student found:', student)
  console.log('Student error:', studentError)

  if (studentError || !student) {
    // If it failed because the table is lowercase, try 'students'
    if (studentError && studentError.message && studentError.message.includes('relation "public.Student" does not exist')) {
      const { data: lowerStudent, error: lowerError } = await supabase
        .from('students')
        .select('*')
        .eq('name', name)
        .eq('initial', initial)
        .eq('pin', pin)
        .single()
        
      if (!lowerError && lowerStudent) {
        return handleFoundStudent(lowerStudent)
      }
    }
    return { error: 'Student not found. Check name, initial and PIN.' }
  }

  return handleFoundStudent(student)
}

const handleFoundStudent = async (student) => {
  // Step 2 — Get class
  let classData = null
  if (student.class_id) {
    const { data } = await supabase
      .from('Class')
      .select('*')
      .eq('id', student.class_id)
      .single()
    classData = data
  }

  // Step 3 — Get parent
  let parentStudent = null
  if (student.id) {
    const { data } = await supabase
      .from('ParentStudent')
      .select('*')
      .eq('student_id', student.id)
      .single()
    parentStudent = data
  }

  return {
    data: {
      ...student,
      class: classData || null,
      parentStudent: parentStudent || null,
    }
  }
}

export const staffLogin = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) return { error: error.message }

  const { data: userData, error: userError } = await supabase
    .from('User')
    .select('*')
    .eq('id', data.user.id)
    .single()

  if (userError) return { error: 'User role not found.' }
  return { data: { ...data, role: userData.role } }
}

export const logout = async () => {
  await supabase.auth.signOut()
}