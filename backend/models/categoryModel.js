// models/categoryModel.js
import mongoose from 'mongoose';

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  count: {
    type: Number,
    default: 0
  }
}, {
  _id: true,
  timestamps: true
});

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true // This automatically creates a unique index
  },
  subcategories: [subcategorySchema]
}, {
  timestamps: true
});

// Remove this duplicate index - the unique: true above already creates it
// categorySchema.index({ name: 1 }); // ← DELETE OR COMMENT THIS LINE

const Category = mongoose.model('Category', categorySchema);
export default Category;