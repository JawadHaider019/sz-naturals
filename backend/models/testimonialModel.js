import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  content: { type: String, required: true },
  rating: { type: Number, default: 5 },
  platform: { type: String, default: 'website' },
  status: { type: String, enum: ['pending', 'approved'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model('Testimonial', testimonialSchema);
