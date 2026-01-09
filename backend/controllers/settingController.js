import bcrypt from "bcryptjs";
import Setting from "../models/settingModel.js";

// Fun to get settings
const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();

    if (!settings) {
      // First-time seeding
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      settings = new Setting({
        email: process.env.ADMIN_EMAIL,
        notifications: true,
        password: hashedPassword,
      });
      await settings.save();
    }

    res.json({
      success: true,
      email: settings.email,
      notifications: settings.notifications,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Fun to update notifications
const updateSettings = async (req, res) => {
  try {
    const { notifications } = req.body;
    let settings = await Setting.findOne();

    if (!settings) {
      return res.json({ success: false, message: "Settings not found" });
    }

    if (notifications !== undefined) {
      settings.notifications = notifications;
    }

    await settings.save();

    res.json({
      success: true,
      message: "Settings updated successfully",
      email: settings.email,
      notifications: settings.notifications,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Fun to change email (requires password)
const changeEmail = async (req, res) => {
  try {
    const { email, password } = req.body;
    let settings = await Setting.findOne();

    if (!settings) {
      return res.json({ success: false, message: "Settings not found" });
    }

    if (!email) {
      return res.json({ success: false, message: "Email is required" });
    }

    if (!password) {
      return res.json({ success: false, message: "Password is required to change email" });
    }

    if (!settings.password) {
      return res.json({ success: false, message: "Admin password not set in DB" });
    }

    const isMatch = await bcrypt.compare(password, settings.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid password" });
    }

    settings.email = email;
    await settings.save();

    res.json({
      success: true,
      message: "Email updated successfully",
      email: settings.email,
      notifications: settings.notifications,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Fun to change password
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    let settings = await Setting.findOne();

    if (!settings || !settings.password) {
      return res.json({ success: false, message: "Settings not initialized" });
    }

    const isMatch = await bcrypt.compare(oldPassword, settings.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid old password" });
    }

    const hashedNew = await bcrypt.hash(newPassword, 10);
    settings.password = hashedNew;
    await settings.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  getSettings,
  updateSettings,
  changeEmail,
  changePassword,
};
