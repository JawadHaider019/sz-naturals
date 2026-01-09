import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  IoIosArrowBack, 
  IoIosArrowForward,
  IoIosCheckmark,
  IoIosTrash,
  IoIosAdd,
  IoIosCreate,
  IoIosClose,
  IoIosGlobe,
  IoIosMail,
  IoIosWarning
} from "react-icons/io";
import { 
  FaStar,
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaWhatsapp
} from 'react-icons/fa'; 


const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

const TestimonialsTab = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [newTestimonial, setNewTestimonial] = useState({ 
    name: '', 
    content: '', 
    rating: 5, 
    platform: 'website' 
  });
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', content: '', rating: 5, platform: 'website' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, testimonial: null });
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Platform options with React Icons and colors
  const platformOptions = [
    { 
      value: 'website', 
      label: 'Website', 
      icon: <IoIosGlobe />, 
      color: 'bg-gray-100 text-gray-800 border-gray-200' 
    },
    { 
      value: 'email', 
      label: 'Email', 
      icon: <IoIosMail />, 
      color: 'bg-gray-100 text-gray-800 border-gray-200' 
    },
    { 
      value: 'facebook', 
      label: 'Facebook', 
      icon: <FaFacebook />, 
      color: 'bg-blue-100 text-blue-800 border-blue-200' 
    },
    { 
      value: 'instagram', 
      label: 'Instagram', 
      icon: <FaInstagram />, 
      color: 'bg-pink-100 text-pink-800 border-pink-200' 
    },
    { 
      value: 'tiktok', 
      label: 'TikTok', 
      icon: <FaTiktok />, 
      color: 'bg-black-100 text-gray-800 border-gray-200' 
    },
    { 
      value: 'whatsapp', 
      label: 'WhatsApp', 
      icon: <FaWhatsapp />, 
      color: 'bg-green-100 text-green-800 border-green-200' 
    }
  ];

  // Fetch testimonials from backend
  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/testimonials`);
      if (!response.ok) throw new Error('Failed to fetch testimonials');
      const data = await response.json();
      setTestimonials(data);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      toast.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  // Add new testimonial to backend
  const addTestimonial = async () => {
    if (newTestimonial.name.trim() === '' || newTestimonial.content.trim() === '') {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/testimonials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTestimonial),
      });

      if (!response.ok) throw new Error('Failed to add testimonial');

      const savedTestimonial = await response.json();
      setTestimonials(prev => [...prev, savedTestimonial]);
      setNewTestimonial({ name: '', content: '', rating: 5, platform: 'website' });
      toast.success('Testimonial added successfully!');
    } catch (error) {
      console.error('Error adding testimonial:', error);
      toast.error('Failed to add testimonial');
    } finally {
      setLoading(false);
    }
  };

  // Approve testimonial
  const approveTestimonial = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/testimonials/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (!response.ok) throw new Error('Failed to approve testimonial');

      const updatedTestimonial = await response.json();
      setTestimonials(prev => 
        prev.map(test => test._id === id ? updatedTestimonial : test)
      );
      toast.success('Testimonial approved!');
    } catch (error) {
      console.error('Error approving testimonial:', error);
      toast.error('Failed to approve testimonial');
    }
  };

  // Update testimonial
  const updateTestimonial = async (id, updatedData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/testimonials/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error('Failed to update testimonial');

      const updatedTestimonial = await response.json();
      setTestimonials(prev => 
        prev.map(test => test._id === id ? updatedTestimonial : test)
      );
      return updatedTestimonial;
    } catch (error) {
      console.error('Error updating testimonial:', error);
      throw error;
    }
  };

  // Delete testimonial
  const deleteTestimonial = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/testimonials/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete testimonial');

      setTestimonials(prev => prev.filter(test => test._id !== id));
      toast.success('Testimonial deleted successfully!');
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast.error('Failed to delete testimonial');
    }
  };

  // Load testimonials on component mount
  useEffect(() => {
    fetchTestimonials();
  }, []);

  // Filter only approved testimonials for the slider
  const approvedTestimonials = testimonials.filter(test => test.status === 'approved');

  // Auto-advance slider
  useEffect(() => {
    if (approvedTestimonials.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % approvedTestimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [approvedTestimonials.length]);

  const openDeleteModal = (testimonial) => {
    setDeleteModal({ isOpen: true, testimonial });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, testimonial: null });
  };

  const confirmDelete = async () => {
    if (deleteModal.testimonial) {
      await deleteTestimonial(deleteModal.testimonial._id);
      if (editingTestimonial === deleteModal.testimonial._id) {
        setEditingTestimonial(null);
      }
      closeDeleteModal();
    }
  };

  const startEditing = (testimonial) => {
    setEditingTestimonial(testimonial._id);
    setEditForm({
      name: testimonial.name,
      content: testimonial.content,
      rating: testimonial.rating,
      platform: testimonial.platform || 'website'
    });
  };

  const cancelEditing = () => {
    setEditingTestimonial(null);
    setEditForm({ name: '', content: '', rating: 5, platform: 'website' });
  };

  const saveEditing = async () => {
    if (editForm.name.trim() === '' || editForm.content.trim() === '') {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      await updateTestimonial(editingTestimonial, editForm);
      setEditingTestimonial(null);
      setEditForm({ name: '', content: '', rating: 5, platform: 'website' });
      toast.success('Testimonial updated successfully!');
    } catch (error) {
      toast.error('Failed to update testimonial');
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % approvedTestimonials.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + approvedTestimonials.length) % approvedTestimonials.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Get platform label for display
  const getPlatformLabel = (platform) => {
    const labels = {
      website: 'Website',
      email: 'Email',
      facebook: 'Facebook',
      instagram: 'Instagram',
      tiktok: 'TikTok',
      whatsapp: 'WhatsApp'
    };
    return labels[platform] || 'Website';
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* Loading State */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      )}

      {/* Add New Testimonial Form */}
      <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Add New Testimonial</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
            <input
              type="text"
              placeholder="Enter customer name"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
              value={newTestimonial.name}
              onChange={(e) => setNewTestimonial({...newTestimonial, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <select
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
              value={newTestimonial.rating}
              onChange={(e) => setNewTestimonial({...newTestimonial, rating: parseInt(e.target.value)})}
            >
              {[1, 2, 3, 4, 5].map(num => (
                <option key={num} value={num}>{num} Star{num !== 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platform/Source</label>
            <select
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
              value={newTestimonial.platform}
              onChange={(e) => setNewTestimonial({...newTestimonial, platform: e.target.value})}
            >
              {platformOptions.map(platform => (
                <option key={platform.value} value={platform.value}>
                  {platform.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Testimonial Content</label>
          <textarea
            placeholder="What did the customer say?"
            rows="3"
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
            value={newTestimonial.content}
            onChange={(e) => setNewTestimonial({...newTestimonial, content: e.target.value})}
          />
        </div>
        <button
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-black text-white font-medium hover:bg-gray-800 focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 flex items-center justify-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={addTestimonial}
          disabled={loading}
        >
          <IoIosAdd className="mr-2" />
          {loading ? 'Adding...' : 'Add Testimonial'}
        </button>
      </div>
      
      {/* Testimonials Table - Responsive Cards for Mobile */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Manage Testimonials</h3>
        </div>
        
        {/* Mobile Card View */}
        <div className="block md:hidden">
          <div className="divide-y divide-gray-200">
            {testimonials.map(testimonial => {
              const platform = platformOptions.find(p => p.value === testimonial.platform) || platformOptions[0];
              return (
                <div key={testimonial._id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{testimonial.name}</h4>
                      <span className={`inline-flex items-center px-2 py-1 mt-1 rounded-full text-xs font-medium ${platform.color} border`}>
                        <span className="mr-1 w-3 text-center">{platform.icon}</span>
                        {platform.label}
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs leading-4 font-semibold rounded-full ${
                      testimonial.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {testimonial.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{testimonial.content}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-yellow-400 mr-1 text-sm">{'★'.repeat(testimonial.rating)}</span>
                      <span className="text-gray-300 text-sm">{'★'.repeat(5-testimonial.rating)}</span>
                    </div>
                    
                    <div className="flex space-x-1">
                      {testimonial.status !== 'approved' && (
                        <button 
                          className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 p-1.5 rounded-lg transition-colors duration-200"
                          onClick={() => approveTestimonial(testimonial._id)}
                          title="Approve"
                          disabled={loading}
                        >
                          <IoIosCheckmark size={16} />
                        </button>
                      )}
                      <button 
                        className="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-lg transition-colors duration-200"
                        onClick={() => startEditing(testimonial)}
                        title="Edit"
                        disabled={loading}
                      >
                        <IoIosCreate size={16} />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition-colors duration-200"
                        onClick={() => openDeleteModal(testimonial)}
                        title="Delete"
                        disabled={loading}
                      >
                        <IoIosTrash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {testimonials.map(testimonial => {
                const platform = platformOptions.find(p => p.value === testimonial.platform) || platformOptions[0];
                return (
                  <tr key={testimonial._id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{testimonial.name}</td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-500 max-w-md">{testimonial.content}</td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${platform.color} border`}>
                        <span className="mr-1.5 w-3 text-center">{platform.icon}</span>
                        {platform.label}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <span className="text-yellow-400 mr-1">{'★'.repeat(testimonial.rating)}</span>
                        <span className="text-gray-300">{'★'.repeat(5-testimonial.rating)}</span>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        testimonial.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {testimonial.status}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium space-x-1 lg:space-x-2">
                      {testimonial.status !== 'approved' && (
                        <button 
                          className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 p-1.5 lg:p-2 rounded-lg transition-colors duration-200"
                          onClick={() => approveTestimonial(testimonial._id)}
                          title="Approve"
                          disabled={loading}
                        >
                          <IoIosCheckmark size={18} />
                        </button>
                      )}
                      <button 
                        className="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-1.5 lg:p-2 rounded-lg transition-colors duration-200"
                        onClick={() => startEditing(testimonial)}
                        title="Edit"
                        disabled={loading}
                      >
                        <IoIosCreate size={18} />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-1.5 lg:p-2 rounded-lg transition-colors duration-200"
                        onClick={() => openDeleteModal(testimonial)}
                        title="Delete"
                        disabled={loading}
                      >
                        <IoIosTrash size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Section - Custom Slider */}
      <div className="p-4 sm:p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div className="mb-4 sm:mb-0">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Website Preview</h3>
            <p className="text-sm text-gray-600 mt-1">This is how your testimonials will appear on your website</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {approvedTestimonials.length} approved testimonial{approvedTestimonials.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        {approvedTestimonials.length > 0 ? (
          <div className="relative my-6 sm:my-10 px-2 sm:px-4 md:px-10 lg:px-20 xl:px-40">
            
            {/* Navigation Buttons */}
            {approvedTestimonials.length > 1 && (
              <>
                <button 
                  className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-gray-200 p-2 sm:p-3 shadow-md transition duration-300 hover:bg-black"
                  onClick={prevSlide}
                >
                  <IoIosArrowBack size={20} className="text-gray-700 hover:text-white" />
                </button>

                <button 
                  className="z-50 absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-gray-200 p-2 sm:p-3 shadow-md transition duration-300 hover:bg-black"
                  onClick={nextSlide}
                >
                  <IoIosArrowForward size={20} className="text-gray-700 hover:text-white" />
                </button>
              </>
            )}

            {/* Slider Container */}
            <div className="relative overflow-hidden">
              <div className="flex transition-transform duration-500 ease-in-out">
                {approvedTestimonials.map((testimonial, index) => (
                  <div
                    key={testimonial._id}
                    className="w-full flex-shrink-0 px-2 sm:px-4"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                  >
                    <div className="flex items-center justify-center">
                      <div className="w-full max-w-2xl rounded-lg bg-white p-4 sm:p-6 lg:p-8 text-center transition duration-300 hover:scale-105">
                        <p className="text-base sm:text-lg lg:text-xl font-semibold text-gray-700">"{testimonial.content}"</p>
                        <p className="mt-3 sm:mt-4 text-sm font-medium text-gray-600">- {testimonial.name}, via {getPlatformLabel(testimonial.platform)}</p>
                        <div className="mt-2 sm:mt-3 flex justify-center">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <FaStar key={i} className="size-4 sm:size-5 text-yellow-500" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots Indicator */}
            {approvedTestimonials.length > 1 && (
              <div className="flex justify-center mt-6 sm:mt-8 space-x-2 sm:space-x-3">
                {approvedTestimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`size-2 sm:size-3 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'bg-black transform scale-125' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
            <div className="text-gray-400 mb-4">
              <IoIosAdd className="text-3xl sm:text-4xl mx-auto" />
            </div>
            <h4 className="text-base sm:text-lg font-medium text-gray-600 mb-2">No Approved Testimonials</h4>
            <p className="text-gray-500 max-w-md mx-auto px-4 text-sm sm:text-base">
              Approve some testimonials from the table above to see how they'll look on your website.
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingTestimonial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Edit Testimonial</h3>
              <button
                onClick={cancelEditing}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                disabled={loading}
              >
                <IoIosClose size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                <input
                  type="text"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <select
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  value={editForm.rating}
                  onChange={(e) => setEditForm({...editForm, rating: parseInt(e.target.value)})}
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num} Star{num !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform/Source</label>
                <select
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  value={editForm.platform}
                  onChange={(e) => setEditForm({...editForm, platform: e.target.value})}
                >
                  {platformOptions.map(platform => (
                    <option key={platform.value} value={platform.value}>
                      {platform.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  rows="3"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  value={editForm.content}
                  onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={cancelEditing}
                className="flex-1 px-4 py-2 sm:py-3 border border-gray-300 text-gray-700  hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={saveEditing}
                className="flex-1 px-4 py-2 sm:py-3 bg-black text-white hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-4 sm:p-6">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 rounded-full bg-red-100">
              <IoIosWarning className="text-red-600 text-lg sm:text-xl" />
            </div>
            
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Testimonial</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                Are you sure you want to delete the testimonial from <strong>{deleteModal.testimonial?.name}</strong>? 
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 sm:py-3 bg-red-600 text-white  hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestimonialsTab;