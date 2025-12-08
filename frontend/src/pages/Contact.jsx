import Title from '../components/Title';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFacebookF,
  faInstagram,
  faTiktok,
  faWhatsapp
} from '@fortawesome/free-brands-svg-icons';
import {
  faMapMarkerAlt,
  faPhone,
  faEnvelope,
  faClock,
  faUserCog,
  faDirections,
  faExternalLinkAlt,
  faPlus,
  faMinus,
  faLocationCrosshairs
} from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Contact = () => {
  const [businessInfo, setBusinessInfo] = useState({
    company: {
      name: "Natural Skincare",
      tagline: "Pure Natural Skincare",
      description: "Pure, handmade natural skincare products crafted with organic ingredients for your wellness."
    },
    contact: {
      customerSupport: {
        email: "contact@naturalskincare.com",
        phone: "+1-555-123-4567",
        hours: "24/7"
      }
    },
    location: {
      displayAddress: "123 Wellness Street, Green Valley",
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
    }
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mapZoom, setMapZoom] = useState({});

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/business-details`);

        if (response.data.success && response.data.data) {
          const data = response.data.data;
          const processedData = processMapLinks(data);
          setBusinessInfo(processedData);
        }
      } catch (error) {
        toast.error("Failed to load business information");
      } finally {
        setLoading(false);
      }
    };

    if (backendUrl) {
      fetchBusinessDetails();
    } else {
      setLoading(false);
    }
  }, []);

  // Function to process map links - use direct embed URLs from backend
  const processMapLinks = (data) => {
    const processedData = { ...data };
    
    // Process main location map link
    if (processedData.location?.googleMapsLink) {
      if (processedData.location.googleMapsLink.includes('/embed?')) {
        processedData.location.googleMapsEmbed = processedData.location.googleMapsLink;
      } else {
        processedData.location.googleMapsEmbed = convertToEmbedUrl(
          processedData.location.googleMapsLink,
          processedData.location.displayAddress
        );
      }
    }
    
    // Process store map links
    if (processedData.multiStore?.stores) {
      for (let store of processedData.multiStore.stores) {
        if (store.location?.googleMapsLink) {
          if (store.location.googleMapsLink.includes('/embed?')) {
            store.location.googleMapsEmbed = store.location.googleMapsLink;
          } else {
            store.location.googleMapsEmbed = convertToEmbedUrl(
              store.location.googleMapsLink,
              store.location.displayName
            );
          }
        } else if (store.location) {
          store.location.googleMapsEmbed = generateEmbedUrlFromAddress(store.location);
        }
      }
    }
    
    return processedData;
  };

  // Convert regular Google Maps URL to embed URL
  const convertToEmbedUrl = (url, address) => {
    if (!url) return generateDefaultEmbedUrl();
    
    try {
      if (url.includes('/embed?')) {
        return url;
      }
      
      if (url.includes('google.com/maps') || url.includes('maps.app.goo.gl')) {
        const urlObj = new URL(url);
        const placeId = urlObj.searchParams.get('place_id');
        const query = urlObj.searchParams.get('q') || urlObj.searchParams.get('destination') || address;
        
        if (placeId) {
          return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13398.257699999999!2d72.4054!3d32.9295!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzLCsDU1JzQ2LjIiTiA3MsKwMjQnNTUuNCJF!5e0!3m2!1sen!2s!4v1742395541712!5m2!1sen!2s&q=place_id:${placeId}&z=17`;
        } else {
          return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13398.257699999999!2d72.4054!3d32.9295!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzLCsDU1JzQ2LjIiTiA3MsKwMjQnNTUuNCJF!5e0!3m2!1sen!2s!4v1742395541712!5m2!1sen!2s&q=${encodeURIComponent(query)}&z=17`;
        }
      }
      
    } catch (error) {
      // Silent error handling
    }
    
    return generateDefaultEmbedUrl();
  };

  // Generate default embed URL
  const generateDefaultEmbedUrl = () => {
    return 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13398.257699999999!2d72.4054!3d32.9295!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzLCsDU1JzQ2LjIiTiA3MsKwMjQnNTUuNCJF!5e0!3m2!1sen!2s!4v1742395541712!5m2!1sen!2s';
  };

  // Generate embed URL from address
  const generateEmbedUrlFromAddress = (location) => {
    if (!location) return generateDefaultEmbedUrl();
    
    const address = location.displayName || 
                   (location.address ? 
                    `${location.address.street}, ${location.address.city}, ${location.address.state}` : 
                    'Wellness Center');
    
    return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13398.257699999999!2d72.4054!3d32.9295!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzLCsDU1JzQ2LjIiTiA3MsKwMjQnNTUuNCJF!5e0!3m2!1sen!2s!4v1742395541712!5m2!1sen!2s&q=${encodeURIComponent(address)}&z=17`;
  };

  // Function to update map zoom for a specific store
  const updateMapZoom = (storeId, zoomChange) => {
    setMapZoom(prev => {
      const currentZoom = prev[storeId] || 17;
      const newZoom = Math.max(8, Math.min(20, currentZoom + zoomChange));
      return {
        ...prev,
        [storeId]: newZoom
      };
    });
  };

  // Function to get current map URL with zoom
  const getMapUrlWithZoom = (store, storeId) => {
    const baseUrl = store.location?.googleMapsEmbed || '';
    const currentZoom = mapZoom[storeId] || 17;
    
    if (baseUrl.includes('?')) {
      let cleanUrl = baseUrl.replace(/[?&]z=\d+/g, '');
      const separator = cleanUrl.includes('?') ? '&' : '?';
      return `${cleanUrl}${separator}z=${currentZoom}`;
    }
    
    return `${baseUrl}?z=${currentZoom}`;
  };

  // Function to reset map view to default
  const resetMapView = (storeId) => {
    setMapZoom(prev => ({
      ...prev,
      [storeId]: 17
    }));
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Connect contact form to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await axios.post(`${backendUrl}/api/contact`, formData);

      if (response.data.success) {
        toast.success("Message sent successfully! We'll get back to you soon.");
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
      } else {
        toast.error(response.data.message || "Failed to send message");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to format operating hours with single day logic
  const formatOperatingHours = (operatingHours) => {
    if (!operatingHours) return "Hours not set";

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const today = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    const todayHours = operatingHours[today];

    const openDays = days.filter(day => {
      const dayHours = operatingHours[day];
      return dayHours && !dayHours.closed && dayHours.open && dayHours.close;
    });

    if (openDays.length === 1) {
      const singleDay = openDays[0];
      const dayHours = operatingHours[singleDay];
      const dayName = singleDay.charAt(0).toUpperCase() + singleDay.slice(1);
      return `Open on ${dayName} only: ${dayHours.open} - ${dayHours.close}`;
    }

    if (todayHours?.closed) {
      return "Closed today";
    }

    if (todayHours?.open && todayHours?.close) {
      return `Today: ${todayHours.open} - ${todayHours.close}`;
    }

    return "Hours not set";
  };

  // Enhanced function to get detailed operating hours summary
  const getOperatingHoursSummary = (operatingHours) => {
    if (!operatingHours) return "Hours not specified";

    const days = [
      { key: 'monday', name: 'Monday' },
      { key: 'tuesday', name: 'Tuesday' },
      { key: 'wednesday', name: 'Wednesday' },
      { key: 'thursday', name: 'Thursday' },
      { key: 'friday', name: 'Friday' },
      { key: 'saturday', name: 'Saturday' },
      { key: 'sunday', name: 'Sunday' }
    ];

    const openDays = days.filter(day => {
      const dayHours = operatingHours[day.key];
      return dayHours && !dayHours.closed && dayHours.open && dayHours.close;
    });

    if (openDays.length === 1) {
      const singleDay = openDays[0];
      const dayHours = operatingHours[singleDay.key];
      return `Open on ${singleDay.name} only: ${dayHours.open} - ${dayHours.close}`;
    }

    const today = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    const todayHours = operatingHours[today.key];

    if (todayHours?.closed) {
      return "Closed today";
    }

    if (todayHours?.open && todayHours?.close) {
      return `Today: ${todayHours.open} - ${todayHours.close}`;
    }

    return "Check hours";
  };

  // Social media platforms configuration
  const socialPlatforms = [
    {
      key: 'facebook',
      icon: faFacebookF,
      label: 'Facebook',
      baseUrl: 'https://facebook.com/'
    },
    {
      key: 'instagram',
      icon: faInstagram,
      label: 'Instagram',
      baseUrl: 'https://instagram.com/'
    },
    {
      key: 'tiktok',
      icon: faTiktok,
      label: 'TikTok',
      baseUrl: 'https://tiktok.com/@'
    },
    {
      key: 'whatsapp',
      icon: faWhatsapp,
      label: 'WhatsApp',
      baseUrl: 'https://wa.me/'
    }
  ];

  // Get stores from business info or use default locations
  const stores = businessInfo.multiStore?.stores && businessInfo.multiStore.stores.length > 0
    ? businessInfo.multiStore.stores
    : [
      {
        storeId: 'default-1',
        storeName: 'Main Store',
        storeType: 'retail',
        location: {
          displayName: '123 Wellness Street, Green Valley',
          address: {
            street: '123 Wellness Street',
            city: 'Green Valley',
            state: 'Wellness State',
            zipCode: '12345'
          },
          googleMapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13398.257699999999!2d72.4054!3d32.9295!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzLCsDU1JzQ2LjIiTiA3MsKwMjQnNTUuNCJF!5e0!3m2!1sen!2s!4v1742395541712!5m2!1sen!2s'
        },
        contact: {
          phone: businessInfo.contact?.customerSupport?.phone || '+1-555-123-4567',
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
        status: "active"
      }
    ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-gray-300 w-48 mx-auto mb-4 rounded-3xl"></div>
          <div className="h-4 bg-gray-300 w-32 mx-auto rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="py-8">
        <div className="text-center">
          <div className="text-3xl">
            <Title text1={'Get in'} text2={'Touch'} />
          </div>
          <p className="text-gray-600 text-base max-w-2xl mx-auto px-4">
            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </div>

      {/* Main Content - Form with Sidebar */}
      <div className="w-full mx-auto px-4 pb-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-5">
          {/* Contact Form - 3 columns */}
            {/* Sidebar - Contact Information - 2 columns */}
          <div className="lg:col-span-2 p-4">
            <div className="bg-white p-6 border border-black/50 rounded-xl shadow-sm sticky top-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-black/50 pb-4">
                Contact Info
              </h3>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-black w-12 h-12 flex items-center justify-center rounded-3xl flex-shrink-0">
                    <FontAwesomeIcon icon={faPhone} className="text-white text-lg" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-base">Phone</h4>
                    <p className="text-gray-600 text-base mt-1">
                      {businessInfo.contact?.customerSupport?.phone || "+1-555-123-4567"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-black w-12 h-12 flex items-center justify-center rounded-3xl flex-shrink-0">
                    <FontAwesomeIcon icon={faEnvelope} className="text-white text-lg" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-base">Email</h4>
                    <p className="text-gray-600 text-base mt-1">
                      {businessInfo.contact?.customerSupport?.email || "contact@naturalskincare.com"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-black w-12 h-12 flex items-center justify-center rounded-3xl flex-shrink-0">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-white text-lg" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-base">Address</h4>
                    <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                      {businessInfo.location?.displayAddress || "123 Wellness Street, Green Valley"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="mt-8 pt-6 border-t border-black/50">
                <h4 className="font-semibold text-gray-900 mb-4 text-base">Follow Us</h4>
                <div className="flex space-x-3">
                  {socialPlatforms.map((platform) => {
                    const socialUrl = businessInfo.socialMedia?.[platform.key];
                    const isActive = !!socialUrl;

                    return (
                      <a
                        key={platform.key}
                        href={isActive ? socialUrl : "#"}
                        target={isActive ? "_blank" : "_self"}
                        rel={isActive ? "noopener noreferrer" : ""}
                        className={`bg-black w-10 h-10 flex items-center justify-center rounded-3xl text-white hover:bg-gray-800 transition-all ${!isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-label={platform.label}
                        title={isActive ? `Follow us on ${platform.label}` : `${platform.label} link not set`}
                        onClick={!isActive ? (e) => e.preventDefault() : undefined}
                      >
                        <FontAwesomeIcon icon={platform.icon} className="text-base" />
                      </a>
                    );
                  })}
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  <p>
                    {Object.values(businessInfo.socialMedia || {}).filter(url => url).length > 0
                      ? "Connect with us on social media"
                      : "Social links coming soon"
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 p-4">
            <div className="bg-white border border-black/50 rounded-xl shadow-sm">
              <div className="p-6 border-b border-black/50">
                <h2 className="text-2xl font-bold text-gray-900">Send Us a Message</h2>
                <p className="text-gray-600 mt-1">Fill out the form below and we'll get back to you soon</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="w-full border border-gray-300 p-3 focus:outline-none focus:border-black transition-all bg-white rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email address"
                      className="w-full border border-gray-300 p-3 focus:outline-none focus:border-black transition-all bg-white rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      className="w-full border border-gray-300 p-3 focus:outline-none focus:border-black transition-all bg-white rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 p-3 focus:outline-none focus:border-black transition-all bg-white rounded-xl"
                      required
                    >
                      <option value="">Select a subject</option>
                      <option value="bulk-order">Bulk Order</option>
                      <option value="general">General Inquiry</option>
                      <option value="order-support">Order Support</option>
                      <option value="feedback">Feedback</option>
                      <option value="suggestions">Suggestions</option>
                      <option value="partnership">Partnership</option>
                      <option value="technical-support">Technical Support</option>
                      <option value="shipping-issues">Shipping & Delivery Issues</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Message *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us how we can help you..."
                    rows="5"
                    className="w-full border border-gray-300 p-3 focus:outline-none focus:border-black transition-all bg-white resize-none rounded-xl"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-black hover:bg-white text-white hover:text-black font-semibold rounded-full border border-transparent hover:border-black transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto whitespace-nowrap"
                                        >
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>

        
        </div>
      </div>

      {/* Full Width Locations Section */}
      {/* <div className="w-full py-12 border-t border-black/50">
        <div className="w-full px-4">
          <div className="text-center mb-12">
            <div className="text-3xl">
              <Title text1={'OUR'} text2={'LOCATIONS'} />
            </div>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto text-lg">
              Visit our stores and facilities across multiple locations
            </p>
          </div>

          <div className={`w-full grid gap-8 ${stores.length === 1 ? 'grid-cols-1 max-w-4xl mx-auto' :
            stores.length === 2 ? 'grid-cols-1 lg:grid-cols-2' :
              stores.length === 3 ? 'grid-cols-1 lg:grid-cols-3' :
                stores.length >= 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
                  'grid-cols-1'
            }`}>
            {stores.map((store, index) => {
              const storeId = store.storeId || `store-${index}`;
              const currentZoom = mapZoom[storeId] || 17;
              const mapUrl = getMapUrlWithZoom(store, storeId);

              return (
                <div key={storeId} className="bg-white border border-black/50 rounded-3xl p-6 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-gray-900 text-lg group-hover:text-black transition-colors">
                        {store.storeName}
                      </h4>
                    </div>
                    <span className={`px-3 py-1 rounded-3xl text-xs font-medium ${store.storeType === 'retail' ? 'bg-blue-100 text-blue-800' :
                        store.storeType === 'warehouse' ? 'bg-orange-100 text-orange-800' :
                          'bg-purple-100 text-purple-800'
                      }`}>
                      {store.storeType || 'store'}
                    </span>
                  </div>

                  <div className="space-y-4 mb-4">
                    <div className="flex items-start space-x-3">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-600 mt-1 text-sm flex-shrink-0" />
                      <div>
                        <p className="text-gray-800 font-semibold text-sm">{store.location?.displayName}</p>
                        {store.location?.address && (
                          <p className="text-gray-600 text-md mt-1">
                            {store.location.address.street && `${store.location.address.street} `}
                          
                          </p>
                        )}
                      </div>
                    </div>

                    {store.contact?.phone && (
                      <div className="flex items-center space-x-3">
                        <FontAwesomeIcon icon={faPhone} className="text-gray-600 text-sm flex-shrink-0" />
                        <p className="text-gray-700 text-sm">{store.contact.phone}</p>
                      </div>
                    )}

                    {store.operatingHours && (
                      <div className="flex items-start space-x-3 text-sm">
                        <FontAwesomeIcon icon={faClock} className="text-gray-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-gray-600 font-medium">
                            {getOperatingHoursSummary(store.operatingHours)}
                          </span>
                          {(() => {
                            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                            const openDays = days.filter(day => {
                              const dayHours = store.operatingHours[day];
                              return dayHours && !dayHours.closed && dayHours.open && dayHours.close;
                            });
                            
                            if (openDays.length === 1) {
                              return (
                                <p className="text-gray-500 text-xs mt-1">
                                  Closed on all other days
                                </p>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    )}

                    {store.contact?.manager && (
                      <div className="flex items-center space-x-3 text-sm">
                        <FontAwesomeIcon icon={faUserCog} className="text-gray-500 flex-shrink-0" />
                        <span className="text-gray-600">Manager: {store.contact.manager}</span>
                      </div>
                    )}

                    {store.status && (
                      <div className="flex justify-start">
                        <span className={`px-3 py-1 rounded-3xl text-xs font-medium ${store.status === 'active' ? 'bg-green-100 text-green-800' :
                            store.status === 'inactive' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                          }`}>
                          {store.status === 'active' ? '✓ Open Now' : '✗ Closed'}
                        </span>
                      </div>
                    )}
                  </div>

                
                  {store.location?.googleMapsEmbed && (
                    <div className="mt-4">
                      <div className="border border-black/50 rounded-3xl overflow-hidden group/map">
                        <div className="relative">
                          <iframe
                            title={`Location - ${store.storeName}`}
                            src={mapUrl}
                            width="100%"
                            height="350"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="transition-opacity group-hover/map:opacity-90"
                            key={mapUrl}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover/map:bg-opacity-10 transition-all duration-300 pointer-events-none"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default Contact;