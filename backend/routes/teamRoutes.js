// routes/teamRoutes.js
import express from 'express';
import {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  updateTeamOrder
} from '../controllers/teamController.js';

import upload from '../middleware/multer.js';
import  adminAuth  from '../middleware/adminAuth.js';

const router = express.Router();

// Public routes
router.get('/', getTeams);
router.get('/:id', getTeam);

// Protected routes (Authenticated users only)
router.post('/', adminAuth, upload.single('image'), createTeam);
router.put('/:id', adminAuth, upload.single('image'), updateTeam);
router.delete('/:id', adminAuth, deleteTeam);
router.patch('/order', adminAuth, updateTeamOrder);

export default router;