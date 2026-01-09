import express from 'express';
import {
  getAllCategories,
  createCategory,
  addSubcategory,
  updateCategory,
  updateSubcategory,
  deleteCategory,
  deleteSubcategory,
  getCategoriesDebug
} from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', getAllCategories);
router.get('/list', getAllCategories); // Add this duplicate route for frontend compatibility
router.post('/', createCategory);
router.post('/:categoryId/subcategories', addSubcategory);
router.put('/:id', updateCategory);
router.put('/:categoryId/subcategories/:subcategoryId', updateSubcategory);
router.delete('/:id', deleteCategory);
router.delete('/:categoryId/subcategories/:subcategoryId', deleteSubcategory);
router.get('/debug', getCategoriesDebug);
export default router;