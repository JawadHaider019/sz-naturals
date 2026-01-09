// routes/businessDetails.js
import express from 'express';
import {
  getBusinessDetails,
  updateCompanyDetails,
  addStore,
  updateStore,
  deleteStore,
  updateStoreLogo,
  toggleStoreStatus,
  setDefaultStore,
  toggleMultiStore,
  updateContactDetails,
  updateSocialMedia,
  updatePolicies,
  getActiveStores,
  getStoreById,
  deleteLogo
} from '../controllers/businessDetailsController.js';
import adminAuth from '../middleware/adminAuth.js'; // Your existing auth
import upload from '../middleware/multer.js'; // Your existing upload

const router = express.Router();


router.get('/', getBusinessDetails);

router.get('/stores', getActiveStores);

router.get('/stores/:storeId', getStoreById);

router.put('/company', adminAuth, upload.fields([
  { name: 'websiteLogo', maxCount: 1 },
  { name: 'adminLogo', maxCount: 1 },
  { name: 'favicon', maxCount: 1 }
]), updateCompanyDetails);

// Add this route after the other routes
router.delete('/logo/:logoType', adminAuth, deleteLogo);

router.put('/contact', adminAuth, updateContactDetails);
router.put('/social-media', adminAuth, updateSocialMedia);

router.put('/policies', adminAuth, updatePolicies);
router.post('/stores', adminAuth, upload.single('storeLogo'), addStore);

router.put('/stores/:storeId', adminAuth, updateStore);
router.patch('/stores/:storeId/logo', adminAuth, upload.single('storeLogo'), updateStoreLogo);

router.patch('/stores/:storeId/status', adminAuth, toggleStoreStatus);
router.delete('/stores/:storeId', adminAuth, deleteStore);

router.patch('/stores/default/:storeId', adminAuth, setDefaultStore);
router.patch('/multi-store/toggle', adminAuth, toggleMultiStore);

export default router;