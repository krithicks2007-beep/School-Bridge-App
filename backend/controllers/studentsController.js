const { createClient } = require('@supabase/supabase-js');
const cloudinary = require('cloudinary').v2;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadPhoto = async (req, res, next) => {
  try {
    const studentId = req.params.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const uploadStream = () => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'school_app/students' },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        stream.end(file.buffer);
      });
    };

    const result = await uploadStream();
    const url = result.secure_url;

    const { error: dbError } = await supabase
      .from('Student') // ensure case sensitivity matches frontend usage
      .update({ photo_url: url })
      .eq('id', studentId);

    if (dbError) {

      if (dbError.message && dbError.message.includes('relation "public.Student" does not exist')) {
        const { error: lowerDbError } = await supabase
          .from('students')
          .update({ photo_url: url })
          .eq('id', studentId);
          
        if (lowerDbError) {
          return res.status(500).json({ error: lowerDbError.message });
        }
      } else {
        return res.status(500).json({ error: dbError.message });
      }
    }

    res.json({ url, error: null });

  } catch (error) {
    next(error);
  }
};

module.exports = { uploadPhoto };
