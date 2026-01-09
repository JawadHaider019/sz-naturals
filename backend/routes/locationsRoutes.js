import express from 'express';
import {
  validateCityAndZipCode,
  getCities,
  getCitySuggestions,
  getPakistanStates,
  getZipCodeInfo,
  getUsage
} from '../controllers/locationsController.js';

const router = express.Router();

// ============================
// City & ZIP Code Endpoints
// ============================
router.post('/validate-city-zip', validateCityAndZipCode);
router.get('/cities', getCities);
router.get('/cities/suggestions', getCitySuggestions);
router.get('/zipcode/:zipCode', getZipCodeInfo);

// ============================
// Pakistan Data Endpoints
// ============================
router.get('/pakistan/states', getPakistanStates);

// ============================
// Utility endpoints
// ============================
router.get('/usage', getUsage);

export default router;