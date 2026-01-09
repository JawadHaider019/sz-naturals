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

router.post('/add', upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 }
]), addProduct);

router.get('/list', listProducts);
router.post('/remove', removeProduct);
router.post('/single', singleProduct);
router.post('/update', upload.fields([
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
  { name: 'image4', maxCount: 1 }
]), updateProduct);

router.post('/update-status', updateProductStatus);



export default router;