import express from 'express';
import { 
  addProduct, 
  listProducts, 
  removeProduct, 
  singleProduct, 
  updateProduct, 
  updateProductStatus
} from '../controllers/productController.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Add product route with video support
router.post('/add', upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 },
  { name: 'video', maxCount: 1 } // Add video field
]), addProduct);

// List products route
router.get('/list', listProducts);

// Remove product route
router.post('/remove', removeProduct);

// Single product route
router.post('/single', singleProduct);

// Update product route with video support
router.post('/update', upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 },
  { name: 'video', maxCount: 1 } // Add video field for updates
]), updateProduct);

// Update product status route
router.post('/update-status', updateProductStatus);

export default router;