// routes/dealTypes.js
import express from 'express';
import {
  getAllDealTypes,
  createDealType,
  updateDealType,
  deleteDealType
} from '../controllers/dealtypeController.js';

const router = express.Router();

// Routes
router.get('/', getAllDealTypes);
router.post('/', createDealType);
router.put('/:id', updateDealType);
router.delete('/:id', deleteDealType);

export default router;
