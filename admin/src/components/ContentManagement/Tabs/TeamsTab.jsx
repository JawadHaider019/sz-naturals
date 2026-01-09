// src/components/Tabs/TeamsTab.jsx
import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faUsers,
  faImage,
  faTimes,
  faEdit,
  faTrash,
  faUserCircle,
  faUpload,
  faSave,
  faTimesCircle,
  faUserPlus,
  faCheckCircle,
  faExclamationTriangle,
  faGripVertical,
  faArrowsUpDown
} from "@fortawesome/free-solid-svg-icons";


const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api`;

const TeamsTab = () => {
  const [teams, setTeams] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [teamRole, setTeamRole] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [teamImage, setTeamImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  
  // Modal and Toast states
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({});
  const [toasts, setToasts] = useState([]);

  // Drag and drop states
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  const fileInputRef = useRef(null);

  // Toast function
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    const newToast = { id, message, type };
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  // Modal function
  const showModalDialog = (title, message, onConfirm, confirmText = "Confirm", type = 'warning') => {
    setModalConfig({
      title,
      message,
      onConfirm,
      confirmText,
      type
    });
    setShowModal(true);
  };

  // Get token from localStorage
  const getToken = () => {
    return localStorage.getItem('token');
  };

  // Fetch teams from API
  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/teams`);
      const data = await response.json();
      if (data.success) {
        // Sort by order field
        const sortedTeams = data.data.sort((a, b) => (a.order || 0) - (b.order || 0));
        setTeams(sortedTeams);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      showToast('Failed to fetch team members', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverItem(index);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = async (e, index) => {
    e.preventDefault();
    
    if (draggedItem === null || draggedItem === index) {
      setDragOverItem(null);
      setDraggedItem(null);
      return;
    }

    // Reorder teams locally
    const newTeams = [...teams];
    const [reorderedItem] = newTeams.splice(draggedItem, 1);
    newTeams.splice(index, 0, reorderedItem);

    // Update order numbers
    const updatedTeams = newTeams.map((team, idx) => ({
      ...team,
      order: idx
    }));

    setTeams(updatedTeams);
    setDragOverItem(null);
    setDraggedItem(null);

    // Update order in backend
    await updateTeamOrder(updatedTeams);
  };

  // Update team order in backend
  const updateTeamOrder = async (updatedTeams) => {
    try {
      setOrderLoading(true);
      
      const orderUpdates = updatedTeams.map((team, index) => ({
        id: team._id,
        order: index
      }));

      const token = getToken();
      const response = await fetch(`${API_BASE}/teams/order`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({ orderUpdates })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update order');
      }

      showToast('Team order updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating team order:', error);
      showToast('Failed to update team order', 'error');
      // Revert to original order
      fetchTeams();
    } finally {
      setOrderLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setTeamImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    setTeamImage(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!teamName.trim() || !teamRole.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', teamName);
      formData.append('role', teamRole);
      formData.append('description', teamDescription);
      
      // Set order for new items to be last
      if (!isEditing) {
        formData.append('order', teams.length);
      }
      
      if (teamImage) {
        formData.append('image', teamImage);
      }

      const token = getToken();
      const headers = {
        'token': token
      };

      let response;
      if (isEditing) {
        response = await fetch(`${API_BASE}/teams/${editingId}`, {
          method: 'PUT',
          headers: headers,
          body: formData,
        });
      } else {
        response = await fetch(`${API_BASE}/teams`, {
          method: 'POST',
          headers: headers,
          body: formData,
        });
      }

      const data = await response.json();

      if (data.success) {
        await fetchTeams();
        resetForm();
        showToast(
          isEditing ? 'Team member updated successfully!' : 'Team member added successfully!',
          'success'
        );
      } else {
        if (data.message === "No token" || data.message === "Invalid token") {
          showModalDialog(
            'Authentication Required',
            'Your session has expired. Please login again to continue.',
            () => {
              window.location.href = '/login';
            },
            'Login',
            'error'
          );
        } else {
          showToast(data.message || 'Something went wrong', 'error');
        }
      }
    } catch (error) {
      console.error('Error saving team:', error);
      showToast('Error saving team member', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (team) => {
    setTeamName(team.name);
    setTeamRole(team.role || "");
    setTeamDescription(team.description || "");
    setImagePreview(team.image?.url || "");
    setIsEditing(true);
    setEditingId(team._id);
  };

  const handleDelete = (id) => {
    showModalDialog(
      'Delete Team Member',
      'Are you sure you want to delete this team member? This action cannot be undone.',
      () => confirmDelete(id),
      'Delete',
      'error'
    );
  };

  const confirmDelete = async (id) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/teams/${id}`, {
        method: 'DELETE',
        headers: {
          'token': token
        }
      });

      const data = await response.json();

      if (data.success) {
        await fetchTeams();
        showToast('Team member deleted successfully!', 'success');
      } else {
        if (data.message === "No token" || data.message === "Invalid token") {
          showModalDialog(
            'Authentication Required',
            'Your session has expired. Please login again to continue.',
            () => {
              window.location.href = '/login';
            },
            'Login',
            'error'
          );
        } else {
          showToast(data.message || 'Something went wrong', 'error');
        }
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      showToast('Error deleting team member', 'error');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    setTeamName("");
    setTeamRole("");
    setTeamDescription("");
    setTeamImage(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalConfig({});
  };

  const handleConfirm = () => {
    if (modalConfig.onConfirm) {
      modalConfig.onConfirm();
    }
    closeModal();
  };

  return (
    <div className="space-y-6">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center p-4 rounded-lg shadow-lg border transform transition-all duration-300 ${
              toast.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <FontAwesomeIcon
              icon={toast.type === 'success' ? faCheckCircle : faExclamationTriangle}
              className={`mr-3 ${
                toast.type === 'success' ? 'text-green-500' : 'text-red-500'
              }`}
            />
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <FontAwesomeIcon
                  icon={modalConfig.type === 'error' ? faExclamationTriangle : faExclamationTriangle}
                  className={`text-2xl mr-3 ${
                    modalConfig.type === 'error' ? 'text-red-500' : 'text-yellow-500'
                  }`}
                />
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalConfig.title}
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                {modalConfig.message}
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className={`px-4 py-2 text-white rounded transition-colors ${
                    modalConfig.type === 'error'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {modalConfig.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FontAwesomeIcon 
            icon={isEditing ? faEdit : faUserPlus} 
            className="mr-2 text-black" 
          />
          {isEditing ? "Edit Team Member" : "Add New Team Member"}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              <FontAwesomeIcon icon={faImage} className="mr-2 text-black" />
              Profile Image
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 rounded object-cover border-2 border-gray-200 shadow-sm cursor-pointer"
                      onClick={handleImageClick}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-md transition-colors"
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-xs" />
                    </button>
                  </div>
                ) : (
                  <div 
                    className="w-20 h-20 rounded bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center shadow-sm cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={handleImageClick}
                  >
                    <FontAwesomeIcon icon={faUserCircle} className="text-2xl text-gray-400" />
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                  id="team-image"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleImageClick}
                  className="px-2 py-2 bg-gray-200 text-black text-sm rounded shadow-sm transition-colors flex items-center hover:bg-gray-300"
                >
                  <FontAwesomeIcon icon={faUpload} />
                  <span>Choose Image</span>
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, WebP recommended. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              <FontAwesomeIcon icon={faUser} className="mr-2 text-black" />
              Full Name *
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black shadow-sm"
              placeholder="Enter team member's full name"
              required
              disabled={loading}
            />
          </div>

          {/* Role Field */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              <FontAwesomeIcon icon={faUser} className="mr-2 text-black" />
              Role/Position *
            </label>
            <input
              type="text"
              value={teamRole}
              onChange={(e) => setTeamRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black shadow-sm"
              placeholder="e.g. Product Manager, Designer"
              required
              disabled={loading}
            />
          </div>
          
          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              <FontAwesomeIcon icon={faUser} className="mr-2 text-black" />
              Bio/Description
            </label>
            <textarea
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black shadow-sm"
              placeholder="Enter team member's bio or description"
              disabled={loading}
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-black text-white shadow-sm transition-colors flex items-center space-x-2 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={isEditing ? faSave : faUserPlus} />
              <span>
                {loading ? 'Saving...' : (isEditing ? "Update Member" : "Add Member")}
              </span>
            </button>
            
            {isEditing && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 focus:outline-none shadow-sm transition-colors flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faTimesCircle} />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Teams List */}
      <div className="bg-white p-6 border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold flex items-center">
            <FontAwesomeIcon icon={faUsers} className="mr-2 text-black" />
            Team Members
          </h3>
          {orderLoading && (
            <div className="flex items-center text-sm text-gray-600">
              <FontAwesomeIcon icon={faArrowsUpDown} className="mr-2 animate-pulse" />
              Updating order...
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <p className="text-black">Loading...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-8">
            <FontAwesomeIcon icon={faUsers} className="text-6xl text-gray-300 mb-4" />
            <p className="text-black text-lg">No team members added yet.</p>
            <p className="text-gray-400 text-sm mt-2">Add your first team member above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teams.map((team, index) => (
              <div
                key={team._id}
                className={`bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group relative ${
                  dragOverItem === index ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                } ${draggedItem === index ? 'opacity-50' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={() => {
                  setDraggedItem(null);
                  setDragOverItem(null);
                }}
              >
                {/* Drag Handle */}
                <div className="absolute top-2 left-2 z-10">
                  <div className="bg-gray-100 hover:bg-gray-200 rounded p-1 cursor-grab active:cursor-grabbing transition-colors">
                    <FontAwesomeIcon 
                      icon={faGripVertical} 
                      className="text-gray-500 text-sm" 
                    />
                  </div>
                </div>

                {/* Order Badge */}
                <div className="absolute top-2 right-2 z-10">
                  <div className="bg-black bg-opacity-70 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    {index + 1}
                  </div>
                </div>

                {/* Image on Top */}
                <div className="relative bg-gray-100 h-48 overflow-hidden">
                  {team.image?.url ? (
                    <img
                      src={team.image.url}
                      alt={team.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <div className="text-center">
                        <FontAwesomeIcon icon={faUserCircle} className="text-4xl text-gray-400 mb-2" />
                        <p className="text-black text-sm">No image</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
                </div>

                {/* Content Section */}
                <div className="p-5">
                  <div>
                    <h4 className="font-bold text-black text-lg mb-1 truncate">{team.name}</h4>
                    <p className="text-black italic font-light text-sm mb-3 px-2 py-1 inline-block">
                      {team.role}
                    </p>
                    
                    {team.description && (
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">
                        {team.description}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(team)}
                      disabled={loading || orderLoading}
                      className="flex-1 px-3 py-2 text-sm bg-black text-white shadow-sm flex items-center justify-center space-x-2 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(team._id)}
                      disabled={loading || orderLoading}
                      className="flex-1 px-3 py-2 text-sm bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Drag and Drop Instructions */}
        {teams.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center text-blue-800 text-sm">
              <FontAwesomeIcon icon={faGripVertical} className="mr-2" />
              <span>Drag and drop team members to reorder them. The order will be saved automatically.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsTab;