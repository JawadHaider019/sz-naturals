import React, { useEffect, useState } from "react";

// Simple toast component
const Toast = ({ message, type = "success", onClose }) => {
  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  
  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right duration-300`}>
      <div className="flex items-center gap-3">
        <span>{message}</span>
        <button 
          onClick={onClose}
          className="text-white hover:text-gray-200 text-lg font-bold"
        >
          ×
        </button>
      </div>
    </div>
  );
};

const OtherTab = () => {
  const [deliverySettings, setDeliverySettings] = useState({
    mode: "fixed",
    fixedCharge: 0,
    freeDeliveryAbove: 0,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // API base URL - use the same as your dashboard

  const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api`;

  // Show toast function
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    // Auto hide after 4 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // Close toast manually
  const closeToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  // Load settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/delivery-settings`);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        setDeliverySettings(data);
        showToast("Delivery settings loaded successfully", "success");
      } catch (err) {
        console.error("Error fetching delivery settings:", err);
        // If endpoint doesn't exist, use default values
        showToast("Using default delivery settings", "error");
        console.log("Using default delivery settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [API_BASE]);

  // Save/update settings
  const saveSettings = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/delivery-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deliverySettings),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      showToast(data.message || "Delivery settings saved successfully!", "success");
    } catch (err) {
      console.error("Error saving delivery settings:", err);
      showToast("Failed to save delivery settings. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={closeToast}
        />
      )}

      {/* Delivery Settings */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Delivery Settings</h3>

        {/* Delivery Mode Toggle - Only Fixed Mode Enabled */}
        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="deliveryMode"
              value="fixed"
              checked={deliverySettings.mode === "fixed"}
              onChange={() =>
                setDeliverySettings({ ...deliverySettings, mode: "fixed" })
              }
              className="w-4 h-4 text-black focus:ring-black border-gray-300"
            />
            Fixed Charges
          </label>

          {/* Disabled API option */}
          <label className="flex items-center gap-2 cursor-not-allowed opacity-50">
            <input 
              type="radio" 
              name="deliveryMode" 
              value="api" 
              disabled 
              className="w-4 h-4 text-gray-400 border-gray-300"
            />
            From API (This feature is not available for now)
          </label>
        </div>

        {/* Fixed Charges Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fixed Delivery Charges (Rs)
          </label>
          <input
            type="number"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
            value={deliverySettings.fixedCharge}
            onChange={(e) =>
              setDeliverySettings({
                ...deliverySettings,
                fixedCharge: parseInt(e.target.value) || 0,
              })
            }
            placeholder="Enter delivery charge"
          />
          <p className="text-xs text-gray-500 mt-1">
            Standard delivery charge applied to all orders
          </p>
        </div>

        {/* Free Delivery Above */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Free Delivery Above (Rs)
          </label>
          <input
            type="number"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
            value={deliverySettings.freeDeliveryAbove}
            onChange={(e) =>
              setDeliverySettings({
                ...deliverySettings,
                freeDeliveryAbove: parseInt(e.target.value) || 0,
              })
            }
            placeholder="Enter minimum order amount for free delivery"
          />
          <p className="text-xs text-gray-500 mt-1">
            Orders above this amount qualify for free delivery
          </p>
        </div>

        {/* Settings Preview */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Current Settings Preview:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Delivery Mode: <span className="font-medium">Fixed Charges</span></p>
            <p>• Delivery Charge: <span className="font-medium">Rs {deliverySettings.fixedCharge}</span></p>
            <p>• Free Delivery: <span className="font-medium">Orders above Rs {deliverySettings.freeDeliveryAbove}</span></p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={saveSettings}
        disabled={saving}
      >
        {saving ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Saving...
          </div>
        ) : (
          "Save Delivery Settings"
        )}
      </button>
    </div>
  );
};

export default OtherTab;