import express from 'express';
import {
  subscribe,
  unsubscribe,
  getSubscribers,
  getStats,
  sendNotification,
  checkSubscriberPreferences
} from '../controllers/newsletterController.js';

const router = express.Router();

// Public routes
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

// Admin routes
router.get('/subscribers', getSubscribers);
router.get('/stats', getStats);
router.get('/preferences-stats', checkSubscriberPreferences);
router.post('/notify', sendNotification);


export default router;