// controllers/deliverySettingsController.js
import DeliverySettings from "../models/DeliverySettings.js";

// Get the latest delivery settings
export const getDeliverySettings = async (req, res) => {
  try {
    const settings = await DeliverySettings.findOne().sort({ createdAt: -1 });

    if (settings) {
      return res.json(settings);
    }

    // Return default values if no settings exist
    res.json({
      mode: "fixed",
      fixedCharge: 0,
      freeDeliveryAbove: 0,
    });
  } catch (err) {
    console.error("Error fetching delivery settings:", err.message);
    res.status(500).json({ error: "Failed to fetch delivery settings" });
  }
};

// Create or update delivery settings
export const saveDeliverySettings = async (req, res) => {
  try {
    const { mode, fixedCharge, freeDeliveryAbove } = req.body;

    // Basic validation
    if (!["fixed", "api"].includes(mode)) {
      return res.status(400).json({ error: "Invalid delivery mode" });
    }
    if (fixedCharge < 0 || freeDeliveryAbove < 0) {
      return res.status(400).json({ error: "Charges cannot be negative" });
    }

    // Update existing or create if not exists
    const updatedSettings = await DeliverySettings.findOneAndUpdate(
      {}, // filter: empty means latest
      { mode, fixedCharge, freeDeliveryAbove },
      { new: true, upsert: true } // upsert = create if not exists
    );

    res.json({
      message: "Delivery settings updated successfully",
      settings: updatedSettings,
    });
  } catch (err) {
    console.error("Error saving delivery settings:", err.message);
    res.status(500).json({ error: "Failed to save delivery settings" });
  }
};
