import multer from "multer";

const storage = multer.diskStorage({
  filename: function (req, file, callback) {
    callback(null, file.originalname); 
  }
});

// Add limits configuration to handle large blog content
const upload = multer({ 
  storage,
  limits: {
    fieldSize: 10 * 1024 * 1024, // 10MB - crucial for blog content
    fileSize: 10 * 1024 * 1024, // 10MB for uploaded files
    fields: 50, // Maximum number of non-file fields
    files: 10, // Maximum number of files
  }
});

export default upload;