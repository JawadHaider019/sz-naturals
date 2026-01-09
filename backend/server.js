import express from 'express';
import cors from "cors"; 
import dotenv from "dotenv";
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';

import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import settingRoutes from "./routes/settingRoutes.js";
import dealRoutes from './routes/dealRoutes.js';
import dashboardRoutes from "./routes/dashboradRoutes.js";
import categoriesRoutes from './routes/categoryRoutes.js';
import dealtypesRoutes from './routes/dealtypeRoutes.js';
import testimonialRoutes from './routes/testimonialRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js'
import commentRoutes from './routes/commentRoutes.js'
import deliverySettingsRoutes from './routes/deliverySettingsRoutes.js';
import blogRoutes from './routes/blogRoutes.js'
import teamRoutes from './routes/teamRoutes.js';
import businessDetailsRoutes from './routes/businessDetailsRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import newsletterRoutes from './routes/NewsletterRoutes.js'
import locationRoutes from './routes/locationsRoutes.js';
// App Config    
const app = express();
const port = process.env.PORT || 4000;
dotenv.config();

app.set('trust proxy', 1);

connectDB();
connectCloudinary();

// Middlewares
app.use(express.json()); 
app.use(cors());
app.use(helmet());


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: 'Too many requests from this IP'
});
app.use(limiter);

// API endpoints 
app.use('/api/user',userRoutes)
app.use('/api/product',productRoutes)
app.use('/api/deal',dealRoutes)
app.use('/api/cart',cartRoutes)
app.use('/api/order',orderRoutes)
app.use("/api/settings", settingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/deal-types', dealtypesRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/banners', bannerRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/delivery-settings", deliverySettingsRoutes);
app.use("/api/blogs",blogRoutes)
app.use('/api/teams', teamRoutes);
app.use('/api/business-details', businessDetailsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/locations', locationRoutes);

app.get('/', (req, res) => {
    res.send("API Working ✅");
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
