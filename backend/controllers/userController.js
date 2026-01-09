// controllers/userController.js
import userModel from "../models/userModel.js";
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import Setting from "../models/settingModel.js";
import { sendPasswordResetEmail, sendPasswordResetSuccessEmail } from "../services/emailService.js";


// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
const createToken = (user) => {
    return jwt.sign({ 
        id: user._id,
        name: user.name,
        email: user.email
    }, process.env.JWT_SECRET);
}

// Route for user login 
const loginUser = async (req, res) => {
   try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });
        
        if (!user) {
            return res.json({ success: false, message: "User doesn't exists" });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = createToken(user);
            res.json({ success: true, token });
        } else {
            res.json({ success: false, message: "Invalid credentials" });
        }
   } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
   }
}

// Route for user register
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // checking user already exists or not 
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "User already exists" });
        }
        
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }
        
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" });
        }

        // hashing user password 
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        });

        const user = await newUser.save();
        const token = createToken(user);
        res.json({ success: true, token });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
// Route for admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    let settings = await Setting.findOne();

    // First-time setup
    if (!settings) {
      if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
        return res.json({ success: false, message: "Admin credentials not set" });
      }

      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      settings = new Setting({
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        notifications: true,
      });
      await settings.save();
    }

    // Validate email
    if (email !== settings.email) {
      return res.json({ success: false, message: "Invalid email" });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, settings.password || "");
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid password" });
    }

    // ✅ JWT token with admin flag
    const token = jwt.sign(
      { email: settings.email, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

// Forgot Password - Send OTP
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email
        if (!email) {
            return res.json({ success: false, message: "Email is required" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        // Find user by email
        const user = await userModel.findOne({ email });
        if (!user) {
            // Don't reveal if user exists for security
            return res.json({ 
                success: true, 
                message: "If an account with that email exists, OTP has been sent" 
            });
        }

        // Generate OTP and set expiration (10 minutes)
        const otp = generateOTP();
        user.resetPasswordOtp = otp;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        // Send email with OTP
        const emailSent = await sendPasswordResetEmail(email, otp, user.name);

        if (!emailSent) {
            return res.json({ 
                success: false, 
                message: "Failed to send OTP email. Please try again." 
            });
        }

        res.json({
            success: true,
            message: "OTP sent to your email successfully"
        });

    } catch (error) {
        console.log('Forgot password error:', error);
        res.json({ 
            success: false, 
            message: "Server error while processing forgot password request" 
        });
    }
}

// Reset Password - Verify OTP and set new password
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        // Validate inputs
        if (!email || !otp || !newPassword) {
            return res.json({ 
                success: false, 
                message: "Email, OTP and new password are required" 
            });
        }

        if (newPassword.length < 8) {
            return res.json({ 
                success: false, 
                message: "Password must be at least 8 characters long" 
            });
        }

        // Find user by email with valid OTP
        const user = await userModel.findOne({ 
            email,
            resetPasswordExpires: { $gt: Date.now() } // Check if OTP is not expired
        });

        if (!user) {
            return res.json({ 
                success: false, 
                message: "Invalid OTP or OTP has expired. Please request a new one." 
            });
        }

        // Verify OTP
        if (user.resetPasswordOtp !== otp) {
            return res.json({ 
                success: false, 
                message: "Invalid OTP" 
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear reset fields
        user.password = hashedPassword;
        user.resetPasswordOtp = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        // Send success email
        await sendPasswordResetSuccessEmail(email, user.name);

        res.json({
            success: true,
            message: "Password reset successfully"
        });

    } catch (error) {
        console.log('Reset password error:', error);
        res.json({ 
            success: false, 
            message: "Server error while resetting password" 
        });
    }
}

// Resend OTP
const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.json({ success: false, message: "Email is required" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ 
                success: true, 
                message: "If an account with that email exists, OTP has been sent" 
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        user.resetPasswordOtp = otp;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        // Send email with new OTP
        const emailSent = await sendPasswordResetEmail(email, otp, user.name);

        if (!emailSent) {
            return res.json({ 
                success: false, 
                message: "Failed to send OTP email. Please try again." 
            });
        }

        res.json({
            success: true,
            message: "New OTP sent to your email"
        });

    } catch (error) {
        console.log('Resend OTP error:', error);
        res.json({ 
            success: false, 
            message: "Server error while resending OTP" 
        });
    }
}
// Get user data
const getUserData = async (req, res) => {
    try {
        const token = req.headers.token;
        if (!token) {
            return res.json({ success: false, message: "Token is required" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.log('Get user data error:', error);
        res.json({ success: false, message: "Invalid token" });
    }
}
// Get user by ID (for admin purposes)
const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const token = req.headers.token;

        // Verify admin token
        if (!token) {
            return res.json({ success: false, message: "Token is required" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user is admin (you might want to add admin check logic)
        // For now, we'll allow any authenticated user to access this
        // You can add admin verification later

        if (!userId) {
            return res.json({ success: false, message: "User ID is required" });
        }

        // Validate if userId is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.json({ success: false, message: "Invalid user ID format" });
        }

        const user = await userModel.findById(userId).select('-password');
        
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                // Add other fields you want to return
            }
        });
    } catch (error) {
        console.log('Get user by ID error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.json({ success: false, message: "Invalid token" });
        }
        if (error.name === 'TokenExpiredError') {
            return res.json({ success: false, message: "Token expired" });
        }
        res.json({ success: false, message: "Server error while fetching user data" });
    }
}

export {
    loginUser,
    registerUser,
    adminLogin,
    forgotPassword,
    resetPassword,
    resendOtp,
    getUserData,
    getUserById
}
