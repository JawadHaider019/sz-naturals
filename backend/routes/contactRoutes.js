import express from 'express';
import {
  submitContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  getContactStats
} from '../controllers/contactController.js';
import adminAuth from '../middleware/adminAuth.js'; // Adjust path as needed

const router = express.Router();

// Public routes - anyone can submit contact form
router.post('/', submitContact);

// Admin protected routes - require admin token
router.get('/', adminAuth, getContacts);
router.get('/stats', adminAuth, getContactStats);
router.get('/:id', adminAuth, getContactById);
router.put('/:id', adminAuth, updateContact);
router.delete('/:id', adminAuth, deleteContact);

export default router;