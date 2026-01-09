import React, { useState, useEffect } from "react"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserCog,
  faSave,
  faLock,
  faSignOutAlt,
  faGlobe,
  faEye,
  faEyeSlash,
  faBuilding,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faClock,
  faUpload,
  faXmark,
  faStore,
  faPlus,
  faEdit,
  faTrash,
  faExternalLinkAlt,
  faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Setting = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    console.log('Setting component mounted with token:', token ? 'Present' : 'Missing');
  }, [token]);


  // Existing admin settings state
  const [settings, setSettings] = useState({
    email: "",
  });

  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordVisibility, setPasswordVisibility] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
    emailPassword: false,
  });

  const [emailPassword, setEmailPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Business details state
  const [businessDetails, setBusinessDetails] = useState({
    company: {
      name: "Natura Bliss",
      tagline: "Pure Natural Skincare",
      description: "Pure, handmade natural skincare products crafted with organic ingredients for your wellness.",
      foundedYear: 2023
    },
    contact: {
      customerSupport: {
        email: "naturabliss@gmail.com",
        phone: "+92-333-3333",
        hours: "24/7"
      }
    },
    location: {
      displayAddress: "123 Natural Street, Green Valley, PK",
      googleMapsLink: ""
    },
    socialMedia: {
      facebook: "",
      instagram: "",
      tiktok: "",
      whatsapp: ""
    },
    multiStore: {
      enabled: false,
      stores: [],
      defaultStore: null
    },
    logos: {
      website: { url: "", public_id: "" },
      admin: { url: "", public_id: "" },
      favicon: { url: "", public_id: "" }
    }
  });

  const [logos, setLogos] = useState({
    website: null,
    admin: null,
    favicon: null
  });
  const [logoPreviews, setLogoPreviews] = useState({
    website: "",
    admin: "",
    favicon: ""
  });
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [error, setError] = useState(null);

  // Store management state
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [newStore, setNewStore] = useState({
    storeName: "",
    storeType: "warehouse",
    location: {
      displayName: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: ""
      },
      coordinates: { lat: 0, lng: 0 },
      googleMapsLink: ""
    },
    contact: {
      phone: "",
      manager: ""
    },
    operatingHours: {
      monday: { open: "09:00", close: "18:00", closed: false },
      tuesday: { open: "09:00", close: "18:00", closed: false },
      wednesday: { open: "09:00", close: "18:00", closed: false },
      thursday: { open: "09:00", close: "18:00", closed: false },
      friday: { open: "09:00", close: "18:00", closed: false },
      saturday: { open: "09:00", close: "18:00", closed: false },
      sunday: { open: "09:00", close: "18:00", closed: true }
    },
    status: "active",
    isActive: true
  });

  // ✅ ADDED: Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState(null);

  // ✅ FIXED: Use logout from auth context
  const handleLogout = () => {
    console.log('Logging out...');
    logout();
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // ✅ FIXED: Fetch admin settings from backend
  useEffect(() => {
    const fetchAdminSettings = async () => {
      try {
        console.log('Fetching admin settings with token:', token ? 'Present' : 'Missing');
        
        if (!token) {
          console.log('No token available, skipping settings fetch');
          setLoadingSettings(false);
          return;
        }

        const { data } = await axios.get(`${backendUrl}/api/settings`, {
          headers: { token },
        });

        console.log('Admin settings data:', data);
        
        if (data.success) {
          setSettings({
            email: data?.email || "",
          });
        }
      } catch (error) {
        console.error("Fetch settings failed:", error);
        
        if (error.response?.status !== 404) {
          toast.error(error.response?.data?.message || "⚠️ Failed to load settings");
        }
        
        if (error.response?.status === 401 || error.response?.status === 403) {
          handleLogout();
        }
      } finally {
        console.log('Settings loading complete');
        setLoadingSettings(false);
      }
    };

    fetchAdminSettings();
  }, [token]);

  // ✅ FIXED: Fetch business details from backend with better error handling
  useEffect(() => {
    const fetchBusinessDetails = async () => {
      try {
        console.log('Fetching business details...');
        const { data } = await axios.get(`${backendUrl}/api/business-details`);
        
        console.log('Business details response:', data);
        
        if (data.success && data.data) {
          const completeData = {
            company: data.data.company || {
              name: "Natura Bliss",
              tagline: "Pure Natural Skincare",
              description: "Pure, handmade natural skincare products crafted with organic ingredients for your wellness.",
              foundedYear: 2023
            },
            contact: data.data.contact || {
              customerSupport: {
                email: "naturabliss@gmail.com",
                phone: "+92-333-3333",
                hours: "24/7"
              }
            },
            location: data.data.location || {
              displayAddress: "123 Natural Street, Green Valley, PK",
              googleMapsLink: ""
            },
            socialMedia: data.data.socialMedia || {
              facebook: "",
              instagram: "",
              tiktok: "",
              whatsapp: ""
            },
            multiStore: data.data.multiStore || {
              enabled: false,
              stores: [],
              defaultStore: null
            },
            logos: data.data.logos || {
              website: { url: "", public_id: "" },
              admin: { url: "", public_id: "" },
              favicon: { url: "", public_id: "" }
            }
          };
          
          setBusinessDetails(completeData);
          
          if (completeData.logos?.website?.url) {
            setLogoPreviews(prev => ({ ...prev, website: completeData.logos.website.url }));
          }
          if (completeData.logos?.admin?.url) {
            setLogoPreviews(prev => ({ ...prev, admin: completeData.logos.admin.url }));
          }
          if (completeData.logos?.favicon?.url) {
            setLogoPreviews(prev => ({ ...prev, favicon: completeData.logos.favicon.url }));
          }
        } else {
          console.warn('Business details fetch returned no data, using defaults');
        }
      } catch (error) {
        console.error("Fetch business details failed:", error);
        if (!error.message?.includes('ETIMEDOUT')) {
          toast.error("⚠️ Failed to load business details");
        }
        setError("Failed to load business details");
      } finally {
        console.log('Business details loading complete');
        setLoadingBusiness(false);
      }
    };

    fetchBusinessDetails();
  }, []);
    // Add this temporary useEffect to debug
useEffect(() => {
  console.log('🔍 Current contact data structure:', {
    contact: businessDetails.contact,
    customerSupport: businessDetails.contact?.customerSupport,
    type: typeof businessDetails.contact?.customerSupport
  });
}, [businessDetails.contact]);
// Add this to debug the contact data changes
useEffect(() => {
  console.log('🔍 DEBUG contact structure:', {
    fullContact: businessDetails.contact,
    customerSupport: businessDetails.contact?.customerSupport,
    type: typeof businessDetails.contact?.customerSupport,
    hasEmail: !!businessDetails.contact?.customerSupport?.email,
    hasPhone: !!businessDetails.contact?.customerSupport?.phone,
    hasHours: !!businessDetails.contact?.customerSupport?.hours
  });
}, [businessDetails.contact]);
  // ✅ FIXED: Loading timeout protection
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loadingSettings || loadingBusiness) {
        console.log('Loading timeout - forcing stop');
        setLoadingTimeout(true);
        setLoadingSettings(false);
        setLoadingBusiness(false);
        toast.warning('Loading took too long. Some data may not be loaded.');
      }
    }, 8000);

    return () => clearTimeout(timeoutId);
  }, [loadingSettings, loadingBusiness]);

  // Handle admin settings input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle password input change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

// ✅ FIXED: Handle business details change with proper nested structure
const handleBusinessChange = (e) => {
  const { name, value } = e.target;
  const path = name.split('.');
  
  console.log('🔄 Business change:', { name, value, path });
  
  if (path.length === 3 && path[0] === 'contact' && path[1] === 'customerSupport') {
    // Handle contact.customerSupport.email, contact.customerSupport.phone, contact.customerSupport.hours
    const field = path[2]; // 'email', 'phone', or 'hours'
    
    setBusinessDetails(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        customerSupport: {
          ...prev.contact.customerSupport,
          [field]: value
        }
      }
    }));
  } else if (path.length === 2) {
    // Handle company.name, company.tagline, etc.
    const [section, field] = path;
    
    setBusinessDetails(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  } else if (path.length === 1) {
    // Handle top-level fields (if any)
    setBusinessDetails(prev => ({
      ...prev,
      [name]: value
    }));
  }
};
  const handleSocialMediaChange = (e) => {
    const { name, value } = e.target;
    setBusinessDetails(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [name]: value
      }
    }));
  };

  // ✅ FIXED: Remove the duplicate handleLogoChange and fix the main one
const handleLogoChange = (e, logoType) => {
  const file = e.target.files[0];
  
  if (!file) {
    console.log('No file selected for', logoType);
    return;
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    toast.error('❌ Please select a valid image file');
    return;
  }

  // Validate file size (e.g., 5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    toast.error('❌ File size too large. Please select an image under 5MB.');
    return;
  }

  console.log(`📁 Selected ${logoType} logo:`, {
    name: file.name,
    type: file.type,
    size: file.size,
    logoType: logoType
  });

  // Create preview URL
  const previewUrl = URL.createObjectURL(file);
  
  // Update logos state with the actual File object
  setLogos(prev => ({
    ...prev,
    [logoType]: file
  }));

  // Update previews
  setLogoPreviews(prev => ({
    ...prev,
    [logoType]: previewUrl
  }));

  // Reset the input to allow selecting the same file again
  e.target.value = '';

  toast.success(`✅ ${logoType.charAt(0).toUpperCase() + logoType.slice(1)} logo selected!`);
};


// ✅ FIXED: Remove logo function with better error handling
const removeLogo = async (logoType) => {
  try {
    console.log(`🗑️ Removing ${logoType} logo...`);
    
    // Check if there's an existing logo in businessDetails
    const existingLogo = businessDetails.logos[logoType];
    const hasExistingLogo = existingLogo?.url && existingLogo?.public_id;
    
    // Also check if there's a new logo selected but not saved yet
    const hasUnsavedLogo = logos[logoType] instanceof File;
    
    // If there's a logo in the backend, call the delete API
    if (hasExistingLogo) {
      console.log(`📡 Calling backend to delete ${logoType} logo:`, existingLogo.public_id);
      
      const response = await axios.delete(
        `${backendUrl}/api/business-details/logo/${logoType}`,
        { 
          headers: { 
            'token': token,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (response.data.success) {
        console.log(`✅ ${logoType} logo deleted from backend`);
        
        // Update business details with the response
        setBusinessDetails(prev => ({
          ...prev,
          logos: response.data.data.logos
        }));
      } else {
        console.warn(`⚠️ Backend deletion failed:`, response.data.message);
        // Continue with local state update even if backend fails
      }
    }

    // Always update local state
    setLogos(prev => ({ ...prev, [logoType]: null }));
    setLogoPreviews(prev => ({ ...prev, [logoType]: "" }));
    
    // Also update business details locally if backend call wasn't made or if there was only an unsaved logo
    if (!hasExistingLogo || hasUnsavedLogo) {
      setBusinessDetails(prev => ({
        ...prev,
        logos: {
          ...prev.logos,
          [logoType]: { url: "", public_id: "" }
        }
      }));
    }

    toast.success(`✅ ${logoType.charAt(0).toUpperCase() + logoType.slice(1)} logo removed successfully!`);
    
  } catch (error) {
    console.error(`❌ Remove ${logoType} logo failed:`, error);
    
    // Even if backend removal fails, remove from UI for better UX
    setLogos(prev => ({ ...prev, [logoType]: null }));
    setLogoPreviews(prev => ({ ...prev, [logoType]: "" }));
    
    setBusinessDetails(prev => ({
      ...prev,
      logos: {
        ...prev.logos,
        [logoType]: { url: "", public_id: "" }
      }
    }));

    // Show appropriate error message
    let errorMessage = `⚠️ Error removing ${logoType} logo`;
    
    if (error.response?.status === 401) {
      errorMessage = "❌ Session expired. Please login again.";
      handleLogout();
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = `⚠️ ${error.message}`;
    }
    
    toast.error(errorMessage);
  }
};
  // ✅ FIXED: Save admin settings
  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.put(
        `${backendUrl}/api/settings`,
        { email: settings.email },
        { headers: { token } }
      );
      toast.success("✅ Settings saved successfully!");
    } catch (error) {
      console.error("Save failed:", error);
      toast.error(error.response?.data?.message || "⚠️ Error saving settings");
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setSaving(false);
    }
  };

// ✅ FIXED: Save business details to backend
const handleSaveBusiness = async () => {
  try {
    setSavingBusiness(true);
    
    const formDataToSend = new FormData();
    
    // Add company info
    formDataToSend.append('companyName', businessDetails.company.name);
    formDataToSend.append('tagline', businessDetails.company.tagline);
    formDataToSend.append('description', businessDetails.company.description);
    formDataToSend.append('foundedYear', businessDetails.company.foundedYear.toString());
    
    // ✅ FIX: Create proper customerSupport object structure
    const customerSupportData = {
      email: businessDetails.contact.customerSupport.email || "codewithjerry0o0@gmail.com",
      phone: businessDetails.contact.customerSupport.phone || "+92-317 5546007",
      hours: businessDetails.contact.customerSupport.hours || "24/7"
    };
    
    console.log('📞 Customer support data being sent:', customerSupportData);
    formDataToSend.append('customerSupport', JSON.stringify(customerSupportData));
    
    // Add location
    formDataToSend.append('location', JSON.stringify(businessDetails.location));
    
    // Add social media
    formDataToSend.append('socialMedia', JSON.stringify(businessDetails.socialMedia));
    
   

    // Add logos
    if (logos.website instanceof File) {
      formDataToSend.append('websiteLogo', logos.website);
      console.log('✅ Added website logo to form data');
    } else {
      console.log('ℹ️ Website logo not added - not a File instance or no file selected');
    }
    
    if (logos.admin instanceof File) {
      formDataToSend.append('adminLogo', logos.admin);
      console.log('✅ Added admin logo to form data');
    } else {
      console.log('ℹ️ Admin logo not added - not a File instance or no file selected');
    }
    
    if (logos.favicon instanceof File) {
      formDataToSend.append('favicon', logos.favicon);
      console.log('✅ Added favicon to form data');
    } else {
      console.log('ℹ️ Favicon not added - not a File instance or no file selected');
    }

    console.log('💾 Saving business details...', {
      companyName: businessDetails.company.name,
      customerSupport: customerSupportData, // Log the actual object
      websiteLogo: logos.website instanceof File,
      adminLogo: logos.admin instanceof File,
      favicon: logos.favicon instanceof File,
      token: token ? 'Present' : 'Missing'
    });

    if (!token) {
      toast.error("❌ Authentication token missing. Please login again.");
      handleLogout();
      return;
    }

    // Log form data contents for debugging
    console.log('📦 FormData entries:');
    for (let pair of formDataToSend.entries()) {
      if (pair[1] instanceof File) {
        console.log(`  ${pair[0]}: File(${pair[1].name}, ${pair[1].type}, ${pair[1].size} bytes)`);
      } else if (pair[0] === 'customerSupport') {
        console.log(`  ${pair[0]}:`, JSON.parse(pair[1])); // Parse and log the object
      } else {
        const value = pair[1];
        const displayValue = typeof value === 'string' && value.length > 100 
          ? value.substring(0, 100) + '...' 
          : value;
        console.log(`  ${pair[0]}: ${displayValue}`);
      }
    }

    const response = await axios.put(
      `${backendUrl}/api/business-details/company`,
      formDataToSend,
      { 
        headers: { 
          'token': token,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000
      }
    );

    console.log('✅ Save response:', response.data);

    if (response.data.success) {
      toast.success("✅ Business details saved successfully!");
      
      // Update business details with response
      setBusinessDetails(response.data.data);
      
      // Reset logo files but keep previews from the response
      setLogos({ website: null, admin: null, favicon: null });
      
      // Update previews with new URLs from backend response
      if (response.data.data.logos) {
        setLogoPreviews({
          website: response.data.data.logos.website?.url || "",
          admin: response.data.data.logos.admin?.url || "",
          favicon: response.data.data.logos.favicon?.url || ""
        });
      }
      
      // Clear any file inputs
      document.querySelectorAll('input[type="file"]').forEach(input => {
        input.value = '';
      });
      
    } else {
      toast.error(response.data.message || "⚠️ Failed to save business details");
    }
  } catch (error) {
    console.error("❌ Save business details failed:", error);
    
    if (error.response?.status === 401 || error.response?.data?.message?.includes('Not Authorized')) {
      toast.error("❌ Session expired. Please login again.");
      handleLogout();
      return;
    }
    
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        "⚠️ Error saving business details";
    toast.error(errorMessage);
  } finally {
    setSavingBusiness(false);
  }
};
  // ✅ FIXED: Add store function with timings
  const handleAddStore = async () => {
    try {
      // Validate required fields
      if (!newStore.storeName.trim()) {
        toast.error("❌ Store name is required");
        return;
      }

      if (!newStore.location.displayName.trim()) {
        toast.error("❌ Display name is required");
        return;
      }

      // Validate address fields
      const address = newStore.location.address;
      if (!address.street.trim() || !address.city.trim() || !address.state.trim() || !address.zipCode.trim()) {
        toast.error("❌ Please fill in all address fields (street, city, state, zip code)");
        return;
      }

      // Validate phone number
      if (!newStore.contact.phone.trim()) {
        toast.error("❌ Phone number is required");
        return;
      }

      const storeData = {
        storeName: newStore.storeName,
        storeType: newStore.storeType,
        location: {
          displayName: newStore.location.displayName,
          address: {
            street: newStore.location.address.street,
            city: newStore.location.address.city,
            state: newStore.location.address.state,
            zipCode: newStore.location.address.zipCode
          },
          coordinates: newStore.location.coordinates,
          googleMapsLink: newStore.location.googleMapsLink
        },
        contact: {
          phone: newStore.contact.phone,
          manager: newStore.contact.manager
        },
        operatingHours: newStore.operatingHours,
        status: newStore.status,
        isActive: newStore.isActive
      };

      console.log('Adding store:', storeData);

      const response = await axios.post(
        `${backendUrl}/api/business-details/stores`,
        storeData,
        { headers: { 'token': token } }
      );

      if (response.data.success) {
        toast.success("✅ Store added successfully!");
        setBusinessDetails(prev => ({
          ...prev,
          multiStore: {
            ...prev.multiStore,
            stores: response.data.data.stores || []
          }
        }));
        setShowStoreForm(false);
        resetStoreForm();
      } else {
        toast.error(response.data.message || "⚠️ Failed to add store");
      }
    } catch (error) {
      console.error("Add store failed:", error);
      toast.error(error.response?.data?.message || "⚠️ Error adding store");
    }
  };

  // ✅ FIXED: Delete store function with modal confirmation
  const handleDeleteStore = async (storeId) => {
    // Set the store to delete and show confirmation modal
    setStoreToDelete(storeId);
    setShowDeleteModal(true);
  };

  // ✅ ADDED: Confirm delete function
  const confirmDeleteStore = async () => {
    if (!storeToDelete) return;
    
    try {
      const response = await axios.delete(
        `${backendUrl}/api/business-details/stores/${storeToDelete}`,
        { headers: { 'token': token } }
      );

      if (response.data.success) {
        toast.success("✅ Store deleted successfully!");
        setBusinessDetails(prev => ({
          ...prev,
          multiStore: {
            ...prev.multiStore,
            stores: response.data.data.stores || []
          }
        }));
      } else {
        toast.error(response.data.message || "⚠️ Failed to delete store");
      }
    } catch (error) {
      console.error("Delete store failed:", error);
      toast.error(error.response?.data?.message || "⚠️ Error deleting store");
    } finally {
      // Close the modal and reset
      setShowDeleteModal(false);
      setStoreToDelete(null);
    }
  };

  // ✅ ADDED: Cancel delete function
  const cancelDeleteStore = () => {
    setShowDeleteModal(false);
    setStoreToDelete(null);
    toast.info("Store deletion cancelled");
  };

  const handleSetDefaultStore = async (storeId) => {
    try {
      const response = await axios.patch(
        `${backendUrl}/api/business-details/stores/default/${storeId}`,
        {},
        { headers: { 'token': token } }
      );

      if (response.data.success) {
        toast.success("✅ Default store updated!");
        setBusinessDetails(prev => ({
          ...prev,
          multiStore: {
            ...prev.multiStore,
            defaultStore: storeId
          }
        }));
      }
    } catch (error) {
      console.error("Set default store failed:", error);
      toast.error(error.response?.data?.message || "⚠️ Error setting default store");
    }
  };

  // ✅ FIXED: Added missing handleEditStore function
  const handleEditStore = (store) => {
    setEditingStore(store);
    setNewStore({
      ...store,
      // Ensure all nested objects exist
      location: store.location || {
        displayName: "",
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: ""
        },
        coordinates: { lat: 0, lng: 0 },
        googleMapsLink: ""
      },
      contact: store.contact || {
        phone: "",
        manager: ""
      },
      operatingHours: store.operatingHours || {
        monday: { open: "09:00", close: "18:00", closed: false },
        tuesday: { open: "09:00", close: "18:00", closed: false },
        wednesday: { open: "09:00", close: "18:00", closed: false },
        thursday: { open: "09:00", close: "18:00", closed: false },
        friday: { open: "09:00", close: "18:00", closed: false },
        saturday: { open: "09:00", close: "18:00", closed: false },
        sunday: { open: "09:00", close: "18:00", closed: true }
      }
    });
    setShowStoreForm(true);
  };

  // ✅ FIXED: Update store function with proper storeId handling
  const handleUpdateStore = async () => {
    console.log('=== UPDATE STORE FUNCTION CALLED ===');
    console.log('1. Editing Store:', editingStore);
    console.log('2. New Store Data:', newStore);
    console.log('3. Token present:', !!token);

    try {
      if (!newStore.storeName.trim()) {
        console.log('❌ Validation failed: Store name required');
        toast.error("❌ Store name is required");
        return;
      }

      // Validate phone number
      if (!newStore.contact.phone.trim()) {
        console.log('❌ Validation failed: Phone number required');
        toast.error("❌ Phone number is required");
        return;
      }

      // ✅ FIX: Include storeId in the storeData
      const storeData = {
        storeId: editingStore.storeId, // ✅ ADD THIS LINE - CRITICAL FIX
        storeName: newStore.storeName,
        storeType: newStore.storeType,
        location: newStore.location,
        contact: newStore.contact,
        operatingHours: newStore.operatingHours,
        status: newStore.status,
        isActive: newStore.isActive
      };

      console.log('4. Store ID being updated:', editingStore?.storeId);
      console.log('5. Store data to send:', storeData);

      if (!editingStore?.storeId) {
        console.log('❌ No store ID found for update');
        toast.error("❌ Cannot update store: No store ID found");
        return;
      }

      if (!token) {
        console.log('❌ No authentication token');
        toast.error("❌ Authentication token missing. Please login again.");
        handleLogout();
        return;
      }

      console.log('6. Making API call to update store...');
      const response = await axios.put(
        `${backendUrl}/api/business-details/stores/${editingStore.storeId}`,
        storeData,
        { 
          headers: { 
            'token': token,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log('7. API Response:', response.data);

      if (response.data.success) {
        console.log('✅ Store update successful');
        toast.success("✅ Store updated successfully!");
        
        // Update the stores list with the updated store
        setBusinessDetails(prev => {
          const updatedStores = prev.multiStore.stores.map(store => 
            store.storeId === editingStore.storeId 
              ? { ...store, ...storeData } // ✅ Use the complete storeData including storeId
              : store
          );
          
          console.log('8. Updated stores list:', updatedStores);
          
          return {
            ...prev,
            multiStore: {
              ...prev.multiStore,
              stores: updatedStores
            }
          };
        });
        
        setShowStoreForm(false);
        setEditingStore(null);
        resetStoreForm();
        
        console.log('9. Form reset and modal closed');
      } else {
        console.log('❌ API returned success: false');
        toast.error(response.data.message || "⚠️ Failed to update store");
      }
    } catch (error) {
      console.log('❌ Update store failed with error:', error);
      console.log('Error response:', error.response);
      console.log('Error message:', error.message);
      
      if (error.response) {
        console.log('Error status:', error.response.status);
        console.log('Error data:', error.response.data);
        
        if (error.response.status === 401 || error.response.status === 403) {
          toast.error("❌ Session expired. Please login again.");
          handleLogout();
          return;
        }
        
        const errorMessage = error.response.data?.message || 
                            error.response.data?.error || 
                            "⚠️ Error updating store";
        toast.error(errorMessage);
      } else if (error.request) {
        console.log('No response received:', error.request);
        toast.error("⚠️ No response from server. Please check your connection.");
      } else {
        console.log('Error setting up request:', error.message);
        toast.error("⚠️ Error updating store: " + error.message);
      }
    }
  };

  // ✅ ADDED: Reset store form function
  const resetStoreForm = () => {
    setNewStore({
      storeName: "",
      storeType: "warehouse",
      location: {
        displayName: "",
        address: {
          street: "",
          city: "",
          state: "",
          zipCode: ""
        },
        coordinates: { lat: 0, lng: 0 },
        googleMapsLink: ""
      },
      contact: {
        phone: "",
        manager: ""
      },
      operatingHours: {
        monday: { open: "09:00", close: "18:00", closed: false },
        tuesday: { open: "09:00", close: "18:00", closed: false },
        wednesday: { open: "09:00", close: "18:00", closed: false },
        thursday: { open: "09:00", close: "18:00", closed: false },
        friday: { open: "09:00", close: "18:00", closed: false },
        saturday: { open: "09:00", close: "18:00", closed: false },
        sunday: { open: "09:00", close: "18:00", closed: true }
      },
      status: "active",
      isActive: true
    });
  };

  const handleNewStoreChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child, subChild] = name.split('.');
      
      if (subChild) {
        // For nested objects like location.address.street
        setNewStore(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [subChild]: value
            }
          }
        }));
      } else {
        // For one-level nested objects
        setNewStore(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      }
    } else {
      // For top-level fields
      setNewStore(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // ✅ FIXED: Change admin password
  const handleChangePassword = async () => {
    if (!passwords.oldPassword || !passwords.newPassword || !passwords.confirmPassword) {
      toast.error("❌ Please fill in all password fields.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("❌ New passwords do not match!");
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast.error("❌ New password must be at least 6 characters long.");
      return;
    }

    try {
      const { data } = await axios.put(
        `${backendUrl}/api/settings/change-password`,
        {
          oldPassword: passwords.oldPassword,
          newPassword: passwords.newPassword,
        },
        { headers: { token } }
      );

      toast.success(data.message || "🔑 Password updated successfully!");
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
      
      toast.info("You will be logged out shortly. Please login with your new password.");
      
      setTimeout(() => {
        handleLogout();
      }, 3000);
    } catch (error) {
      console.error("Password change failed:", error);
      const errorMessage = error.response?.data?.message || 
                          "Error changing password. Please check your current password.";
      toast.error(errorMessage);
    }
  };

  // ✅ FIXED: Change admin email
  const handleChangeEmail = async () => {
    if (!settings.email) {
      toast.error("❌ Email cannot be empty.");
      return;
    }

    if (!emailPassword) {
      toast.error("❌ Please enter your password to change email.");
      return;
    }

    try {
      setChangingEmail(true);
      const { data } = await axios.put(
        `${backendUrl}/api/settings/change-email`,
        { email: settings.email, password: emailPassword },
        { headers: { token } }
      );

      if (data.success) {
        toast.success(data.message || "📧 Email updated successfully!");
        setEmailPassword("");
        toast.info("Please login again with your new email");
        setTimeout(() => {
          handleLogout();
        }, 2000);
      } else {
        toast.error(data.message || "⚠️ Failed to update email");
      }
    } catch (error) {
      console.error("Email change failed:", error);
      const errorMessage = error.response?.data?.message || 
                          "Error changing email. Please try again.";
      toast.error(errorMessage);
    } finally {
      setChangingEmail(false);
    }
  };

  // ✅ FIXED: Loading state
  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 text-lg mb-4">⚠️ Error Loading Settings</div>
        <div className="text-gray-600 mb-4">{error}</div>
        <button 
          onClick={() => setError(null)}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  if ((loadingSettings || loadingBusiness) && !loadingTimeout) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
        <div>⏳ Loading settings...</div>
        <div className="text-sm text-gray-500 mt-2">
          Settings: {loadingSettings ? 'Loading...' : 'Loaded'} | 
          Business: {loadingBusiness ? 'Loading...' : 'Loaded'}
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: "general",
      label: "General Settings",
      icon: faGlobe,
      description: "Manage admin email"
    },
    {
      id: "business",
      label: "Business Details",
      icon: faBuilding,
      description: "Update business information and stores"
    },
    {
      id: "security",
      label: "Security",
      icon: faLock,
      description: "Change password and security settings"
    }
  ];

  const currentTab = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-8xl mx-auto p-2">
        <div className="bg-white rounded-2xl shadow-xl flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar */}
          <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-gray-200 bg-white p-6">
            <div className="sticky top-6">
              <div className="flex items-center gap-3 mb-6">
                <FontAwesomeIcon icon={faUserCog} className="text-2xl text-black" />
                <h1 className="text-2xl font-bold">Settings</h1>
              </div>
              
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                        isActive
                          ? "bg-black text-white border"
                          : "text-gray-700 hover:bg-gray-50 text-black border border-gray-300"
                      }`}
                    >
                      <FontAwesomeIcon icon={tab.icon} className="text-lg" />
                      <div className="flex-1 text-left">
                        <div className="font-semibold">{tab.label}</div>
                        <div className={`text-xs ${
                          isActive ? "text-white" : "text-gray-500"
                        }`}>
                          {tab.description}
                        </div>
                      </div>
                      <span className={`text-xs transition-transform ${
                        isActive ? "rotate-90 text-white" : "text-gray-400"
                      }`}>
                        ▶
                      </span>
                    </button>
                  );
                })}
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 bg-red-50 text-red-600 hover:bg-red-100 border border-red-300"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="text-lg" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Logout</div>
                    <div className="text-xs text-red-600">Sign out from your account</div>
                  </div>
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6 bg-gray-50">
            {currentTab && (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {currentTab.label}
                  </h1>
                  <p className="text-gray-600 mt-1">{currentTab.description}</p>
                </div>

                {/* General Settings Tab */}
                {activeTab === "general" && (
                  <GeneralSettingsContent
                    settings={settings}
                    handleChange={handleChange}
                    emailPassword={emailPassword}
                    setEmailPassword={setEmailPassword}
                    passwordVisibility={passwordVisibility}
                    togglePasswordVisibility={togglePasswordVisibility}
                    changingEmail={changingEmail}
                    handleChangeEmail={handleChangeEmail}
                    saving={saving}
                    handleSave={handleSave}
                  />
                )}

                {/* Business Details Tab */}
                {activeTab === "business" && (
                  <BusinessDetailsContent
                    businessDetails={businessDetails}
                    handleBusinessChange={handleBusinessChange}
                    handleSocialMediaChange={handleSocialMediaChange}
                    handleLogoChange={handleLogoChange}
                    removeLogo={removeLogo}
                    logoPreviews={logoPreviews}
                    handleSaveBusiness={handleSaveBusiness}
                    savingBusiness={savingBusiness}
                    showStoreForm={showStoreForm}
                    setShowStoreForm={setShowStoreForm}
                    editingStore={editingStore}
                    setEditingStore={setEditingStore}
                    newStore={newStore}
                    setNewStore={setNewStore}
                    handleAddStore={handleAddStore}
                    handleUpdateStore={handleUpdateStore}
                    handleEditStore={handleEditStore}
                    handleDeleteStore={handleDeleteStore}
                    handleSetDefaultStore={handleSetDefaultStore}
                    handleNewStoreChange={handleNewStoreChange}
                    resetStoreForm={resetStoreForm}
                    // ✅ ADDED: Delete modal props
                    showDeleteModal={showDeleteModal}
                    confirmDeleteStore={confirmDeleteStore}
                    cancelDeleteStore={cancelDeleteStore}
                  />
                )}

                {/* Security Tab */}
                {activeTab === "security" && (
                  <SecurityContent
                    passwords={passwords}
                    handlePasswordChange={handlePasswordChange}
                    passwordVisibility={passwordVisibility}
                    togglePasswordVisibility={togglePasswordVisibility}
                    handleChangePassword={handleChangePassword}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* ✅ ADDED: Global Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 text-xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Delete Store</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this store? This action cannot be undone and all store data will be permanently removed.
            </p>
            
            <div className="flex gap-4">
              <button
                onClick={cancelDeleteStore}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteStore}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faTrash} />
                Delete Store
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// General Settings Component
const GeneralSettingsContent = ({
  settings,
  handleChange,
  emailPassword,
  setEmailPassword,
  passwordVisibility,
  togglePasswordVisibility,
  changingEmail,
  handleChangeEmail,
  saving,
  handleSave
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Admin Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Email
            </label>  
            <input
              type="email"
              name="email"
              value={settings.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="relative">
            <input
              type={passwordVisibility.emailPassword ? "text" : "password"}
              placeholder="Enter password to confirm email change"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg pr-10"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => togglePasswordVisibility("emailPassword")}
            >
              <FontAwesomeIcon 
                icon={passwordVisibility.emailPassword ? faEyeSlash : faEye} 
                className="text-gray-500"
              />
            </button>
          </div>
          <button
            onClick={handleChangeEmail}
            disabled={changingEmail}
            className="bg-black text-white px-6 py-2 rounded-lg disabled:opacity-70"
          >
            {changingEmail ? "Updating..." : "Change Email"}
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg disabled:opacity-70"
        >
          <FontAwesomeIcon icon={faSave} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};


const BusinessDetailsContent = ({
  businessDetails,
  handleBusinessChange,
  handleSocialMediaChange,
  handleLogoChange,
  removeLogo,
  logoPreviews,
  handleSaveBusiness,
  savingBusiness,
  showStoreForm,
  setShowStoreForm,
  editingStore,
  setEditingStore,
  newStore,
  setNewStore,
  handleAddStore,
  handleUpdateStore,
  handleEditStore,
  handleDeleteStore,
  handleSetDefaultStore,
  handleNewStoreChange,
  resetStoreForm,
  showDeleteModal,
  confirmDeleteStore,
  cancelDeleteStore
}) => {
  const safeBusinessDetails = {
    company: businessDetails?.company || {
      name: "Natura Bliss",
      tagline: "Pure Natural Skincare",
      description: "Pure, handmade natural skincare products crafted with organic ingredients for your wellness.",
      foundedYear: 2024
    },
    contact: {
      customerSupport: {
        email: businessDetails?.contact?.customerSupport?.email || "",
        phone: businessDetails?.contact?.customerSupport?.phone || "", 
        hours: businessDetails?.contact?.customerSupport?.hours || ""
      }
    },
    location: businessDetails?.location || {
      displayAddress: "123 Natural Street, Green Valley, PK",
      googleMapsLink: ""
    },
    socialMedia: businessDetails?.socialMedia || {
      facebook: "",
      instagram: "",
      tiktok: "",
      whatsapp: ""
    },
    multiStore: businessDetails?.multiStore || {
      enabled: false,
      stores: [],
      defaultStore: null
    },
    logos: businessDetails?.logos || {
      website: { url: "", public_id: "" },
      admin: { url: "", public_id: "" },
      favicon: { url: "", public_id: "" }
    }
  };

  const formatOperatingHours = (operatingHours) => {
    if (!operatingHours) return "Not specified";
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const today = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    const todayHours = operatingHours[today];
    
    if (todayHours?.closed) {
      return "Closed today";
    }
    
    if (todayHours?.open && todayHours?.close) {
      return `Today: ${todayHours.open} - ${todayHours.close}`;
    }
    
    return "Hours not set";
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Logo Upload Section - Responsive */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Brand Logos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2  gap-4 sm:gap-6">
          {[
            { type: 'website', label: 'Website Logo', description: 'Main logo for your website' },
            { type: 'admin', label: 'Admin Logo', description: 'Logo for admin panel' },
            
          ].map((logo) => {
            const hasExistingLogo = safeBusinessDetails.logos[logo.type]?.url;
            const hasPreview = logoPreviews[logo.type];
            const showLogo = hasPreview || hasExistingLogo;
            
            return (
              <div key={logo.type} className="text-center">
                <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-3 group">
                  {showLogo ? (
                    <>
                      <img
                        src={hasPreview ? logoPreviews[logo.type] : safeBusinessDetails.logos[logo.type].url}
                        alt={logo.label}
                        className="w-full h-full rounded-xl sm:rounded-2xl object-cover border-2 sm:border-4 border-white shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeLogo(logo.type)}
                        className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-600 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs hover:bg-red-700 transition-all duration-200 z-10 transform hover:scale-110"
                        title={`Remove ${logo.label}`}
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-xl sm:rounded-2xl transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-white text-xs font-medium bg-black bg-opacity-70 px-2 py-1 rounded hidden sm:block">
                          Click X to remove
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full rounded-xl sm:rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <FontAwesomeIcon icon={faBuilding} className="text-xl sm:text-2xl text-gray-400" />
                    </div>
                  )}
                </div>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{logo.label}</h4>
                <p className="text-xs text-gray-600 mb-3 hidden sm:block">{logo.description}</p>
                <input
                  type="file"
                  onChange={(e) => handleLogoChange(e, logo.type)}
                  accept="image/*"
                  className="hidden"
                  id={`${logo.type}-upload`}
                />
                <label
                  htmlFor={`${logo.type}-upload`}
                  className="cursor-pointer bg-black text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm hover:bg-gray-800 transition-colors inline-block"
                >
                  <FontAwesomeIcon icon={faUpload} className="mr-1 sm:mr-2" />
                  {showLogo ? 'Change' : 'Upload'}
                </label>
                
                {showLogo && (
                  <p className="text-xs mt-2">
                    <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                      hasPreview ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></span>
                    {hasPreview ? 'New image selected' : 'Current logo'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Company Information - Responsive */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Company Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name *
            </label>
            <input
              type="text"
              name="company.name"
              value={safeBusinessDetails.company.name}
              onChange={handleBusinessChange}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tagline
            </label>
            <input
              type="text"
              name="company.tagline"
              value={safeBusinessDetails.company.tagline}
              onChange={handleBusinessChange}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="company.description"
              value={safeBusinessDetails.company.description}
              onChange={handleBusinessChange}
              rows={3}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
              required
            />
          </div>
        </div>
      </div>

      {/* Contact Information - Responsive */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Support Email *
            </label>
            <input
              type="email"
              name="contact.customerSupport.email"
              value={safeBusinessDetails.contact.customerSupport.email || ""}
              onChange={handleBusinessChange}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
              required
              placeholder="codewithjerry0o0@gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Support Phone *
            </label>
            <input
              type="text"
              name="contact.customerSupport.phone"
              value={safeBusinessDetails.contact.customerSupport.phone || ""}
              onChange={handleBusinessChange}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
              required
              placeholder="+92-317 5546007"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Support Hours
            </label>
            <input
              type="text"
              name="contact.customerSupport.hours"
              value={safeBusinessDetails.contact.customerSupport.hours || ""}
              onChange={handleBusinessChange}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
              placeholder="e.g., 24/7 or 9:00 AM - 6:00 PM"
            />
          </div>
        </div>
      </div>

      {/* Location Information - Responsive */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-gray-500" />
          Address
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Address *
          </label>
          <textarea
            name="location.displayAddress"
            value={safeBusinessDetails.location.displayAddress}
            onChange={handleBusinessChange}
            rows={2}
            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
            required
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Google Maps Link
          </label>
          <input
            type="url"
            name="location.googleMapsLink"
            value={safeBusinessDetails.location.googleMapsLink}
            onChange={handleBusinessChange}
            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
            placeholder="https://maps.google.com/?q=your+address"
          />
        </div>
      </div>

      {/* Social Media - Responsive */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Social Media Links
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {[
            { label: "Facebook", name: "facebook" },
            { label: "Instagram", name: "instagram" },
            { label: "TikTok", name: "tiktok" },
            { label: "WhatsApp", name: "whatsapp" },
          ].map((social, index) => (
            <div key={index}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {social.label}
              </label>
              <input
                type="url"
                name={social.name}
                value={safeBusinessDetails.socialMedia[social.name]}
                onChange={handleSocialMediaChange}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
                placeholder={`https://${social.name.toLowerCase()}.com/yourpage`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Store Management Section - Responsive */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            <FontAwesomeIcon icon={faStore} className="mr-2 text-gray-500" />
            Store Management
          </h3>
          <button
            onClick={() => {
              setEditingStore(null);
              resetStoreForm();
              setShowStoreForm(true);
            }}
            className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Store
          </button>
        </div>

        {/* Store Form Modal - Responsive */}
        {showStoreForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg sm:text-xl font-semibold">
                  {editingStore ? 'Edit Store' : 'Add New Store'}
                </h3>
                <button
                  onClick={() => {
                    setShowStoreForm(false);
                    setEditingStore(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-lg sm:text-xl" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Store Basic Info */}
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Name *
                    </label>
                    <input
                      type="text"
                      name="storeName"
                      value={newStore.storeName}
                      onChange={handleNewStoreChange}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
                      required
                      placeholder="Enter store name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Type *
                    </label>
                    <select
                      name="storeType"
                      value={newStore.storeType}
                      onChange={handleNewStoreChange}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
                    >
                      <option value="warehouse">Warehouse</option>
                      <option value="retail">Retail Store</option>
                      <option value="cart">Cart</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      name="location.displayName"
                      value={newStore.location.displayName}
                      onChange={handleNewStoreChange}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
                      required
                      placeholder="Enter display name for the store"
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <input
                      type="text"
                      name="contact.phone"
                      value={newStore.contact.phone}
                      onChange={handleNewStoreChange}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
                      placeholder="Store phone number"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manager
                    </label>
                    <input
                      type="text"
                      name="contact.manager"
                      value={newStore.contact.manager}
                      onChange={handleNewStoreChange}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
                      placeholder="Store manager name"
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div className="border-t pt-4">
                  <h4 className="text-base sm:text-lg font-semibold mb-3">Address Information *</h4>
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        name="location.address.street"
                        value={newStore.location.address.street}
                        onChange={handleNewStoreChange}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
                        required
                        placeholder="Enter street address"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          name="location.address.city"
                          value={newStore.location.address.city}
                          onChange={handleNewStoreChange}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
                          required
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State
                        </label>
                        <input
                          type="text"
                          name="location.address.state"
                          value={newStore.location.address.state}
                          onChange={handleNewStoreChange}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
                          required
                          placeholder="State"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Zip Code
                        </label>
                        <input
                          type="text"
                          name="location.address.zipCode"
                          value={newStore.location.address.zipCode}
                          onChange={handleNewStoreChange}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
                          required
                          placeholder="Zip Code"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Google Maps Link
                      </label>
                      <input
                        type="url"
                        name="location.googleMapsLink"
                        value={newStore.location.googleMapsLink}
                        onChange={handleNewStoreChange}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
                        placeholder="https://maps.google.com/?q=your+address"
                      />
                    </div>
                  </div>
                </div>

                {/* Store Timings - Responsive */}
                <div className="border-t pt-4">
                  <h4 className="text-base sm:text-lg font-semibold mb-3">Store Timings</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { day: 'monday', label: 'Mon' },
                      { day: 'tuesday', label: 'Tue' },
                      { day: 'wednesday', label: 'Wed' },
                      { day: 'thursday', label: 'Thu' },
                      { day: 'friday', label: 'Fri' },
                      { day: 'saturday', label: 'Sat' },
                      { day: 'sunday', label: 'Sun' }
                    ].map(({ day, label }) => (
                      <div key={day} className="border rounded-lg p-2 sm:p-3">
                        <div className="flex items-center justify-between mb-2">
                          <label className="font-medium text-gray-700 text-sm sm:text-base">{label}</label>
                          <label className="flex items-center gap-2 text-xs sm:text-sm">
                            <input
                              type="checkbox"
                              checked={!newStore.operatingHours[day]?.closed}
                              onChange={(e) => {
                                setNewStore(prev => ({
                                  ...prev,
                                  operatingHours: {
                                    ...prev.operatingHours,
                                    [day]: {
                                      ...prev.operatingHours[day],
                                      closed: !e.target.checked
                                    }
                                  }
                                }));
                              }}
                              className="rounded"
                            />
                            Open
                          </label>
                        </div>
                        {!newStore.operatingHours[day]?.closed && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Open</label>
                              <input
                                type="time"
                                value={newStore.operatingHours[day]?.open || "09:00"}
                                onChange={(e) => {
                                  setNewStore(prev => ({
                                    ...prev,
                                    operatingHours: {
                                      ...prev.operatingHours,
                                      [day]: {
                                        ...prev.operatingHours[day],
                                        open: e.target.value
                                      }
                                    }
                                  }));
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Close</label>
                              <input
                                type="time"
                                value={newStore.operatingHours[day]?.close || "18:00"}
                                onChange={(e) => {
                                  setNewStore(prev => ({
                                    ...prev,
                                    operatingHours: {
                                      ...prev.operatingHours,
                                      [day]: {
                                        ...prev.operatingHours[day],
                                        close: e.target.value
                                      }
                                    }
                                  }));
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={editingStore ? handleUpdateStore : handleAddStore}
                    className="flex-1 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm sm:text-base"
                  >
                    {editingStore ? 'Update Store' : 'Add Store'}
                  </button>
                  <button
                    onClick={() => {
                      setShowStoreForm(false);
                      setEditingStore(null);
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stores List - Responsive */}
        {safeBusinessDetails.multiStore.stores.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {safeBusinessDetails.multiStore.stores.map((store) => (
              <div key={store.storeId} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900 text-base sm:text-lg">{store.storeName}</h4>
                      {safeBusinessDetails.multiStore.defaultStore === store.storeId && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                          Default
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        store.storeType === 'retail' ? 'bg-blue-100 text-blue-800' :
                        store.storeType === 'warehouse' ? 'bg-orange-100 text-orange-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {store.storeType}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        store.status === 'active' ? 'bg-green-100 text-green-800' :
                        store.status === 'inactive' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {store.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="flex items-center">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-gray-400 w-4" />
                        <span className="truncate">{store.location?.displayName || 'No address provided'}</span>
                      </p>
                      <p className="flex items-center">
                        <FontAwesomeIcon icon={faPhone} className="mr-2 text-gray-400 w-4" />
                        {store.contact?.phone || 'No phone'}
                      </p>
                      <p className="flex items-center">
                        <FontAwesomeIcon icon={faClock} className="mr-2 text-gray-400 w-4" />
                        {formatOperatingHours(store.operatingHours)}
                      </p>
                      {store.contact?.manager && (
                        <p className="flex items-center">
                          <FontAwesomeIcon icon={faUserCog} className="mr-2 text-gray-400 w-4" />
                          Manager: {store.contact.manager}
                        </p>
                      )}
                      {store.location?.address && (
                        <p className="text-xs text-gray-500 mt-1">
                          {store.location.address.street}, {store.location.address.city}, {store.location.address.state} {store.location.address.zipCode}
                        </p>
                      )}
                      {store.location?.googleMapsLink && (
                        <div className="mt-2">
                          <a
                            href={store.location.googleMapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs sm:text-sm"
                          >
                            <FontAwesomeIcon icon={faExternalLinkAlt} className="text-xs" />
                            View on Google Maps
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-auto">
                    {safeBusinessDetails.multiStore.defaultStore !== store.storeId && (
                      <button
                        onClick={() => handleSetDefaultStore(store.storeId)}
                        className="text-xs bg-blue-600 text-white px-2 sm:px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                        title="Set as Default"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleEditStore(store)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit Store"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      onClick={() => handleDeleteStore(store.storeId)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete Store"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FontAwesomeIcon icon={faStore} className="text-3xl sm:text-4xl text-gray-300 mb-3" />
            <p className="text-gray-500 text-base sm:text-lg">No stores added yet</p>
            <p className="text-gray-400 text-sm mt-1">Add your first store to get started</p>
          </div>
        )}
      </div>

      {/* Save Button - Responsive */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveBusiness}
          disabled={savingBusiness}
          className="flex items-center justify-center gap-2 bg-black text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg disabled:opacity-70 w-full sm:w-auto text-sm sm:text-base"
        >
          <FontAwesomeIcon icon={faSave} />
          {savingBusiness ? "Saving..." : "Save Business Details"}
        </button>
      </div>
    </div>
  );
};

// Security Component
const SecurityContent = ({
  passwords,
  handlePasswordChange,
  passwordVisibility,
  togglePasswordVisibility,
  handleChangePassword
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Change Password
        </h3>
        <div className="space-y-4">
          {[
            { label: "Current Password", name: "oldPassword" },
            { label: "New Password", name: "newPassword" },
            { label: "Confirm New Password", name: "confirmPassword" },
          ].map((field, index) => (
            <div key={index} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label} <span className="text-red-500">*</span>
              </label>
              <input
                type={passwordVisibility[field.name] ? "text" : "password"}
                name={field.name}
                placeholder={field.label}
                value={passwords[field.name]}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center mt-6"
                onClick={() => togglePasswordVisibility(field.name)}
              >
                <FontAwesomeIcon 
                  icon={passwordVisibility[field.name] ? faEyeSlash : faEye} 
                  className="text-gray-500"
                />
              </button>
            </div>
          ))}
          
          <button
            onClick={handleChangePassword}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 w-full md:w-auto"
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default Setting;