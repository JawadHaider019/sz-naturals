// controllers/categoryController.js
import Category from '../models/categoryModel.js';

// Get all categories with subcategories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new category
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category = new Category({
      name: name.trim(),
      subcategories: []
    });

    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add subcategory to existing category
const addSubcategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Subcategory name is required' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const newSubcategory = {
      name: name.trim(),
      count: 0
    };

    category.subcategories.push(newSubcategory);
    const updatedCategory = await category.save();

    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update subcategory
const updateSubcategory = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Subcategory name is required' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const subcategory = category.subcategories.id(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    subcategory.name = name.trim();
    const updatedCategory = await category.save();

    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete subcategory - FIXED VERSION
const deleteSubcategory = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const subcategory = category.subcategories.id(subcategoryId);
    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    // Use pull method for more reliable deletion
    category.subcategories.pull({ _id: subcategoryId });
    await category.save();

    res.json({ 
      message: 'Subcategory deleted successfully',
      success: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Add this to your categoryController.js
const getCategoriesDebug = async (req, res) => {
  try {
    const categories = await Category.find({});
    console.log('=== ALL CATEGORIES IN DATABASE ===');
    categories.forEach(cat => {
      console.log(`Category: ${cat.name} (ID: ${cat._id})`);
      console.log('Subcategories:', cat.subcategories.map(sub => ({
        name: sub.name,
        id: sub._id
      })));
      console.log('---');
    });
    
    res.json({ 
      success: true, 
      categories: categories.map(cat => ({
        _id: cat._id,
        name: cat.name,
        subcategories: cat.subcategories
      }))
    });
  } catch (error) {
    console.error('Debug categories error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export {
  getAllCategories,
  createCategory,
  addSubcategory,
  updateCategory,
  updateSubcategory,
  deleteCategory,
  deleteSubcategory,
  getCategoriesDebug
};