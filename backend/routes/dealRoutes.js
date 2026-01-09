import express from 'express';
import { 
  addDeal, 
  listDeals, 
  removeDeal, 
  singleDeal, 
  updateDeal, 
  updateDealStatus

} from '../controllers/dealController.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/add', upload.fields([
  { name: 'dealImage1', maxCount: 1 },
  { name: 'dealImage2', maxCount: 1 },
  { name: 'dealImage3', maxCount: 1 },
  { name: 'dealImage4', maxCount: 1 }
]), addDeal);

router.get('/list', listDeals);
router.post('/remove', removeDeal);
router.post('/single', singleDeal);
router.post('/update', upload.fields([
  { name: 'dealImage1', maxCount: 1 },
  { name: 'dealImage2', maxCount: 1 },
  { name: 'dealImage3', maxCount: 1 },
  { name: 'dealImage4', maxCount: 1 }
]), updateDeal);
router.post('/update-status', updateDealStatus);


export default router;