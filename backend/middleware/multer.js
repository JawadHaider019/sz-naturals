import multer from "multer";

const storage = multer.diskStorage({
  filename: function (req, file, callback) {
    callback(null, file.originalname); 
  }
});

// Add file filter function
const fileFilter = (req, file, cb) => {
  // For image fields
  if (file.fieldname.startsWith('image')) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for image fields!'), false);
    }
  }
  // For video field
  else if (file.fieldname === 'video') {
    // Allow common video formats
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/3gpp'];
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only MP4, WebM, MOV, or 3GP videos are allowed!'), false);
    }
  }
  // For other fields
  else {
    cb(null, true);
  }
};

// Add limits configuration to handle large blog content
const upload = multer({ 
  storage,
  fileFilter, // Add file filter
  limits: {
    fieldSize: 10 * 1024 * 1024, // 10MB - crucial for blog content
    fileSize: 10 * 1024 * 1024, // 10MB for uploaded files (perfect for short videos)
    fields: 50, // Maximum number of non-file fields
    files: 10, // Maximum number of files
  }
});

export default upload;