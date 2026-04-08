import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'audio/midi' ||
    file.mimetype === 'audio/x-midi' ||
    file.originalname.toLowerCase().endsWith('.mid') ||
    file.originalname.toLowerCase().endsWith('.midi')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only .mid / .midi files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

export default upload;
