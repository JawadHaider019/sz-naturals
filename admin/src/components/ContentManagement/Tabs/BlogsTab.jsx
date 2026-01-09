import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck, faEdit, faTrash, faPlus, faImage, faLink,
  faTimes, faEye, faPaperPlane, faBold, faItalic, faListUl,
  faListOl, faQuoteLeft, faCode, faHeading, faPalette, faSearch,
  faCalendar, faUser, faTags, faUpload, faEyeSlash,
  faGlobe, faBookmark, faClock, faSpinner, faInfoCircle, faExclamationTriangle,
  faExternalLinkAlt, faFilter, faVideo, faPlay, faWarning
} from '@fortawesome/free-solid-svg-icons';

// Custom Alert Component
const CustomAlert = ({ type, message, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const alertStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-gray-50 border-gray-200 text-gray-800'
  };

  const iconStyles = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-gray-400'
  };

  const icons = {
    success: faCheck,
    error: faExclamationTriangle,
    warning: faExclamationTriangle,
    info: faInfoCircle
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center p-3 sm:p-4 mb-4 border rounded-lg shadow-lg transform transition-all duration-300 max-w-xs sm:max-w-md ${alertStyles[type]}`}>
      <FontAwesomeIcon icon={icons[type]} className={`mr-2 sm:mr-3 ${iconStyles[type]}`} />
      <div className="text-sm font-medium flex-1">{message}</div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-2 bg-transparent hover:opacity-70 transition-opacity flex-shrink-0"
      >
        <FontAwesomeIcon icon={faTimes} className="text-gray-400 hover:text-gray-600 text-sm" />
      </button>
    </div>
  );
};

// Enhanced Markdown renderer component with video and link support
const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  const renderFormattedContent = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let inList = false;
    let listType = '';
    let listItems = [];

    const flushList = () => {
      if (listItems.length > 0) {
        if (listType === 'ul') {
          elements.push(
            <ul key={`list-${elements.length}`} className="list-disc ml-4 sm:ml-6 mb-4 space-y-2 text-gray-700 text-sm sm:text-base">
              {listItems.map((item, idx) => (
                <li key={`${idx}-${Date.now()}`} className="leading-relaxed">{renderInlineFormatting(item)}</li>
              ))}
            </ul>
          );
        } else if (listType === 'ol') {
          elements.push(
            <ol key={`list-${elements.length}`} className="list-decimal ml-4 sm:ml-6 mb-4 space-y-2 text-gray-700 text-sm sm:text-base">
              {listItems.map((item, idx) => (
                <li key={`${idx}-${Date.now()}`} className="leading-relaxed">{renderInlineFormatting(item)}</li>
              ))}
            </ol>
          );
        }
        listItems = [];
        inList = false;
      }
    };

    const renderInlineFormatting = (line) => {
      if (!line) return line;

      let processedLine = line;

      // Handle links [text](url)
      processedLine = processedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline transition-colors">$1</a>');

      processedLine = processedLine.replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-bold"><em class="italic">$1</em></strong>');
      processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
      processedLine = processedLine.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
      processedLine = processedLine.replace(/`(.*?)`/g, '<code class="bg-gray-800 text-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');

      return <span dangerouslySetInnerHTML={{ __html: processedLine }} />;
    };

    lines.forEach((line, index) => {
      // Handle video embedding ![video](video-url)
      if (line.startsWith('![video](') && line.endsWith(')')) {
        flushList();
        const videoUrl = line.substring(10, line.length - 1);
        elements.push(
          <div key={`video-${index}`} className="my-4 sm:my-6">
            <video
              controls
              className="w-full rounded-lg shadow-md max-h-64 sm:max-h-96 object-cover"
              poster={videoUrl.replace(/\.(mp4|mov|avi|webm)$/, '.jpg')}
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        );
      }
      // Handle image embedding ![alt](image-url)
      else if (line.startsWith('![') && line.endsWith(')') && !line.startsWith('![video](')) {
        flushList();
        const altText = line.substring(2, line.indexOf(']('));
        const imageUrl = line.substring(line.indexOf('](') + 2, line.length - 1);
        elements.push(
          <div key={`image-${index}`} className="my-4 sm:my-6">
            <img
              src={imageUrl}
              alt={altText}
              className="w-full rounded-lg shadow-md max-h-64 sm:max-h-96 object-cover"
            />
          </div>
        );
      }
      else if (line.startsWith('# ')) {
        flushList();
        elements.push(<h1 key={`h1-${index}`} className="text-2xl sm:text-3xl font-bold text-gray-900 mt-4 sm:mt-6 mb-3 sm:mb-4 leading-tight">{line.substring(2)}</h1>);
      }
      else if (line.startsWith('## ')) {
        flushList();
        elements.push(<h2 key={`h2-${index}`} className="text-xl sm:text-2xl font-bold text-gray-800 mt-3 sm:mt-5 mb-2 sm:mb-3 leading-tight">{line.substring(3)}</h2>);
      }
      else if (line.startsWith('### ')) {
        flushList();
        elements.push(<h3 key={`h3-${index}`} className="text-lg sm:text-xl font-semibold text-gray-800 mt-3 sm:mt-4 mb-2 leading-tight">{line.substring(4)}</h3>);
      }
      else if (line.startsWith('> ')) {
        flushList();
        elements.push(
          <blockquote key={`blockquote-${index}`} className="border-l-4 border-gray-300 pl-3 sm:pl-4 italic text-gray-600 my-3 sm:my-4 bg-gray-50 py-2 sm:py-3 px-3 sm:px-4 rounded-r text-sm sm:text-base">
            {renderInlineFormatting(line.substring(2))}
          </blockquote>
        );
      }
      else if (line.startsWith('- ')) {
        if (!inList || listType !== 'ul') {
          flushList();
          inList = true;
          listType = 'ul';
        }
        listItems.push(line.substring(2));
      }
      else if (line.match(/^\d+\. /)) {
        if (!inList || listType !== 'ol') {
          flushList();
          inList = true;
          listType = 'ol';
        }
        const itemText = line.replace(/^\d+\. /, '');
        listItems.push(itemText);
      }
      else if (line.trim().startsWith('```')) {
        if (!line.trim().endsWith('```')) {
          elements.push(<div key={`code-${index}`} className="bg-gray-900 text-gray-100 p-3 sm:p-4 rounded-lg my-3 sm:my-4 font-mono text-sm overflow-x-auto" />);
        }
      }
      else if (line.trim()) {
        flushList();
        elements.push(<p key={`p-${index}`} className="mb-3 sm:mb-4 text-gray-700 leading-relaxed text-sm sm:text-base">{renderInlineFormatting(line)}</p>);
      }
      else {
        flushList();
        if (elements.length > 0) {
          elements.push(<br key={`br-${index}`} />);
        }
      }
    });

    flushList();
    return elements;
  };

  return <div className="prose max-w-none text-gray-700">{renderFormattedContent(content)}</div>;
};

// API Service Functions
const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/blogs`;

const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;

    // Default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Prepare the request body
    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof FormData)) {
      body = JSON.stringify(body);
    }

    const response = await fetch(url, {
      headers,
      ...options,
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Blog API calls
const blogApi = {
  getAllBlogs: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    return apiRequest(`?${params.toString()}`);
  },

  getBlogById: async (id) => {
    return apiRequest(`/${id}`);
  },

  createBlog: async (blogData, file) => {
    const formData = new FormData();

    Object.entries(blogData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => formData.append(key, item));
      } else if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });

    if (file) {
      formData.append('media', file);
    }

    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  },

  updateBlog: async (id, blogData, file) => {
    const formData = new FormData();

    Object.entries(blogData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => formData.append(key, item));
      } else if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });

    if (file) {
      formData.append('media', file);
    }

    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  },

  deleteBlog: async (id) => {
    return apiRequest(`/${id}`, { method: 'DELETE' });
  },

  toggleFeatured: async (id) => {
    return apiRequest(`/${id}/featured`, { method: 'PATCH' });
  },

  togglePublishStatus: async (id) => {
    return apiRequest(`/${id}/publish-status`, { method: 'PATCH' });
  },
};

// Category API calls
const categoryApi = {
  getAllCategories: async () => {
    return apiRequest('/categories');
  },

  createCategory: async (name) => {
    return apiRequest('/categories', {
      method: 'POST',
      body: { name },
    });
  },

  updateCategory: async (oldName, newName) => {
    return apiRequest(`/categories/${encodeURIComponent(oldName)}`, {
      method: 'PUT',
      body: { newName },
    });
  },

  deleteCategory: async (name) => {
    return apiRequest(`/categories/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  },
};

// Enhanced BlogsTab Component with Backend API Integration
const BlogsTab = ({ blogs, setBlogs, categories: initialCategories = [] }) => {
  const [newBlog, setNewBlog] = useState({
    title: '', content: '', excerpt: '', category: [], subcategory: '',
    imageUrl: '', tags: [], author: 'Admin',
    readTime: '1', featured: false, metaDescription: '', status: 'draft'
  });
  const [editingBlog, setEditingBlog] = useState(null);
  const [viewingBlog, setViewingBlog] = useState(null);
  const [activeTab, setActiveTab] = useState('create');
  const [newTag, setNewTag] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [showPreview, setShowPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkData, setLinkData] = useState({ text: '', url: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);

  // Category management state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [localCategories, setLocalCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const fileInputRef = useRef(null);
  const contentTextareaRef = useRef(null);
  const editContentTextareaRef = useRef(null);
  const currentFileRef = useRef(null);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadBlogs = async (filters = {}) => {
    setIsLoadingBlogs(true);
    try {
      const result = await blogApi.getAllBlogs(filters);
      if (result.success) {
        setBlogs(result.data);
      } else {
        addAlert('error', 'Failed to load blogs');
      }
    } catch (error) {
      addAlert('error', 'Error loading blogs: ' + error.message);
    } finally {
      setIsLoadingBlogs(false);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      console.log('Loading categories...');
      setIsLoadingCategories(true);
      const result = await categoryApi.getAllCategories();
      console.log('Categories loaded:', result);

      if (result.success) {
        setLocalCategories(result.data);
      } else {
        console.error('Failed to load categories:', result.message);
        addAlert('error', 'Failed to load categories: ' + result.message);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      addAlert('error', 'Error loading categories: ' + error.message);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Add alert function
  const addAlert = (type, message, duration = 5000) => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, type, message, duration }]);
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  // Calculate read time
  useEffect(() => {
    const readTime = calculateReadTime(newBlog.content);
    setNewBlog(prev => ({ ...prev, readTime: readTime.toString() }));
  }, [newBlog.content]);

  // File upload handler (only image)
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      currentFileRef.current = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewBlog({ ...newBlog, imageUrl: e.target.result });
        addAlert('success', 'Image selected for upload!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Fixed Link insertion functionality
  const openLinkModal = () => {
    const textarea = contentTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = newBlog.content.substring(start, end);

      setLinkData({
        text: selectedText || '',
        url: ''
      });
      setLinkModalOpen(true);
    }
  };

  const insertLink = () => {
    if (linkData.url) {
      const textarea = contentTextareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = newBlog.content.substring(start, end);

      const linkText = linkData.text || selectedText || 'Link';
      const linkMarkdown = `[${linkText}](${linkData.url})`;

      const newContent = newBlog.content.substring(0, start) + linkMarkdown + newBlog.content.substring(end);
      setNewBlog({ ...newBlog, content: newContent });

      setLinkModalOpen(false);
      addAlert('success', 'Link inserted successfully!');

      setTimeout(() => {
        textarea.focus();
        const newPosition = start + linkMarkdown.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };

  // Tag management
  const addTag = () => {
    if (newTag.trim() && !newBlog.tags.includes(newTag.trim())) {
      setNewBlog({ ...newBlog, tags: [...newBlog.tags, newTag.trim()] });
      setNewTag('');
      addAlert('success', 'Tag added!');
    }
  };

  const removeTag = (tagToRemove) => {
    setNewBlog({ ...newBlog, tags: newBlog.tags.filter(tag => tag !== tagToRemove) });
    addAlert('info', 'Tag removed!');
  };

  // Formatting tools with link support
  const insertFormatting = (format, isEditMode = false) => {
    const textarea = isEditMode ? editContentTextareaRef.current : contentTextareaRef.current;
    const content = isEditMode ? editingBlog.content : newBlog.content;
    const setContent = isEditMode ?
      (content) => setEditingBlog({ ...editingBlog, content }) :
      (content) => setNewBlog({ ...newBlog, content });

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let formattedText = '';
    let cursorOffset = 0;

    switch (format) {
      case 'bold': formattedText = `**${selectedText}**`; cursorOffset = 2; break;
      case 'italic': formattedText = `*${selectedText}*`; cursorOffset = 1; break;
      case 'bold-italic': formattedText = `***${selectedText}***`; cursorOffset = 3; break;
      case 'heading': formattedText = `# ${selectedText}`; cursorOffset = 2; break;
      case 'quote': formattedText = `> ${selectedText}`; cursorOffset = 2; break;
      case 'code': formattedText = `\`${selectedText}\``; cursorOffset = 1; break;
      case 'ul': formattedText = `- ${selectedText}`; cursorOffset = 2; break;
      case 'ol':
        const currentLineStart = content.lastIndexOf('\n', start) + 1;
        const currentLineEnd = content.indexOf('\n', start);
        const currentLine = content.substring(currentLineStart, currentLineEnd === -1 ? content.length : currentLineEnd);
        const olMatch = currentLine.match(/^(\d+)\.\s/);
        formattedText = olMatch ? `${parseInt(olMatch[1]) + 1}. ${selectedText}` : `1. ${selectedText}`;
        cursorOffset = 4;
        break;
      case 'image': formattedText = `![${selectedText || 'image'}](${selectedText || 'image-url'})`; cursorOffset = 2; break;
      default: formattedText = selectedText;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + (selectedText ? cursorOffset + selectedText.length : formattedText.length);
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Helper functions
  const calculateReadTime = (content) => {
    if (!content?.trim()) return 1;
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  const generateExcerpt = (content) => {
    return content?.length > 150 ? content.substring(0, 150) + '...' : content || '';
  };

  const quickAddBlog = async (status = 'published') => {
    if (!newBlog.content.trim()) {
      addAlert('error', 'Please add some content to your blog post');
      return;
    }

    // Enhanced category validation
    const selectedCategory = Array.isArray(newBlog.category) ? newBlog.category[0] : newBlog.category;
    if (!selectedCategory || selectedCategory.trim() === '') {
      addAlert('error', 'Please select a category for your blog post');
      return;
    }

    const blogData = {
      title: newBlog.title || `Blog Post ${blogs.length + 1}`,
      content: newBlog.content,
      excerpt: newBlog.excerpt || generateExcerpt(newBlog.content),
      category: [selectedCategory],
      tags: newBlog.tags,
      author: newBlog.author,
      featured: newBlog.featured,
      metaDescription: newBlog.metaDescription || generateExcerpt(newBlog.content),
      status: status,
      ...(newBlog.imageUrl && { imageUrl: newBlog.imageUrl }),
      readTime: calculateReadTime(newBlog.content)
    };

    console.log('Submitting blog data:', blogData);

    setIsLoading(true);
    try {
      const file = currentFileRef.current;
      const result = await blogApi.createBlog(blogData, file);

      if (result.success) {
        setBlogs([result.data, ...blogs]);
        // Reset form completely
        setNewBlog({
          title: '', content: '', excerpt: '', category: [], subcategory: '',
          imageUrl: '', tags: [], author: 'Admin',
          readTime: '1', featured: false, metaDescription: '', status: 'draft'
        });
        currentFileRef.current = null;
        setShowPreview(false);
        addAlert('success', status === 'published' ? 'Blog published successfully!' : 'Blog saved as draft');
        
        // Reload categories to update counts
        await loadCategories();
      } else {
        addAlert('error', result.message || 'Failed to create blog');
      }
    } catch (error) {
      addAlert('error', 'Error creating blog: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBlog = async () => {
    if (!editingBlog?.content.trim()) {
      addAlert('error', 'Please add some content to your blog post');
      return;
    }

    // Validate category
    if (!editingBlog.category || editingBlog.category.length === 0 || !editingBlog.category[0]) {
      addAlert('error', 'Please select a category for your blog post');
      return;
    }

    const updateData = {
      title: editingBlog.title,
      content: editingBlog.content,
      excerpt: editingBlog.excerpt || generateExcerpt(editingBlog.content),
      category: editingBlog.category,
      tags: editingBlog.tags,
      author: editingBlog.author,
      featured: editingBlog.featured,
      metaDescription: editingBlog.metaDescription || generateExcerpt(editingBlog.content),
      readTime: calculateReadTime(editingBlog.content),
      ...(editingBlog.imageUrl && { imageUrl: editingBlog.imageUrl })
    };

    setIsLoading(true);
    try {
      const file = currentFileRef.current;
      const result = await blogApi.updateBlog(editingBlog._id, updateData, file);

      if (result.success) {
        setBlogs(blogs.map(blog => blog._id === editingBlog._id ? result.data : blog));
        setEditingBlog(null);
        currentFileRef.current = null;
        addAlert('success', 'Blog updated successfully!');

        // Reload categories to update counts
        await loadCategories();
      } else {
        addAlert('error', result.message || 'Failed to update blog');
      }
    } catch (error) {
      addAlert('error', 'Error updating blog: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBlog = async (id) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      setIsLoading(true);
      try {
        const result = await blogApi.deleteBlog(id);
        if (result.success) {
          setBlogs(blogs.filter(blog => blog._id !== id));
          addAlert('success', 'Blog deleted successfully!');
          // Reload categories to update counts
          await loadCategories();
        } else {
          addAlert('error', result.message || 'Failed to delete blog');
        }
      } catch (error) {
        addAlert('error', 'Error deleting blog: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const toggleFeatured = async (id) => {
    setIsLoading(true);
    try {
      const result = await blogApi.toggleFeatured(id);
      if (result.success) {
        setBlogs(blogs.map(blog => blog._id === id ? result.data : blog));
        addAlert('success', 'Featured status updated!');
      } else {
        addAlert('error', result.message || 'Failed to update featured status');
      }
    } catch (error) {
      addAlert('error', 'Error updating featured status: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePublishStatus = async (id) => {
    setIsLoading(true);
    try {
      const result = await blogApi.togglePublishStatus(id);
      if (result.success) {
        setBlogs(blogs.map(blog => blog._id === id ? result.data : blog));
        addAlert('success', 'Publish status updated!');
      } else {
        addAlert('error', result.message || 'Failed to update publish status');
      }
    } catch (error) {
      addAlert('error', 'Error updating publish status: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const filters = {};
    if (searchTerm) filters.search = searchTerm;
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (contentTypeFilter !== 'all') filters.contentType = contentTypeFilter;

    loadBlogs(filters);
  }, [searchTerm, statusFilter, contentTypeFilter]);

  // Media preview (image only)
  const renderMediaPreview = () => {
    if (!newBlog.imageUrl) return null;

    return (
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-base sm:text-lg font-semibold text-gray-900">Image Preview</h4>
          <button
            onClick={() => {
              setNewBlog(prev => ({ ...prev, imageUrl: '' }));
              addAlert('info', 'Image removed');
            }}
            className="text-red-500 hover:text-red-700 transition-colors text-xs sm:text-sm flex items-center"
          >
            <FontAwesomeIcon icon={faTimes} className="mr-1" />
            Remove Image
          </button>
        </div>

        <div className="rounded-lg overflow-hidden border border-gray-200">
          <img src={newBlog.imageUrl} alt="Preview" className="w-full h-32 sm:h-48 object-cover" />
        </div>
      </div>
    );
  };

  // Formatting toolbar component (video button removed)
  const FormattingToolbar = ({ isEditMode = false }) => (
    <div className="flex flex-wrap gap-1 mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
      <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
        <button onClick={() => insertFormatting('bold', isEditMode)} className="p-1 sm:p-2 hover:bg-gray-200 rounded transition-colors text-xs sm:text-sm" title="Bold">
          <FontAwesomeIcon icon={faBold} />
        </button>
        <button onClick={() => insertFormatting('italic', isEditMode)} className="p-1 sm:p-2 hover:bg-gray-200 rounded transition-colors text-xs sm:text-sm" title="Italic">
          <FontAwesomeIcon icon={faItalic} />
        </button>
        <button onClick={() => insertFormatting('bold-italic', isEditMode)} className="p-1 sm:p-2 hover:bg-gray-200 rounded transition-colors font-bold italic text-xs sm:text-sm" title="Bold & Italic">
          B/I
        </button>
      </div>
      <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
        <button onClick={() => insertFormatting('heading', isEditMode)} className="p-1 sm:p-2 hover:bg-gray-200 rounded transition-colors text-xs sm:text-sm" title="Heading">
          <FontAwesomeIcon icon={faHeading} />
        </button>
        <button onClick={() => insertFormatting('quote', isEditMode)} className="p-1 sm:p-2 hover:bg-gray-200 rounded transition-colors text-xs sm:text-sm" title="Quote">
          <FontAwesomeIcon icon={faQuoteLeft} />
        </button>
        <button onClick={() => insertFormatting('code', isEditMode)} className="p-1 sm:p-2 hover:bg-gray-200 rounded transition-colors text-xs sm:text-sm" title="Code">
          <FontAwesomeIcon icon={faCode} />
        </button>
      </div>
      <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
        <button onClick={() => insertFormatting('ul', isEditMode)} className="p-1 sm:p-2 hover:bg-gray-200 rounded transition-colors text-xs sm:text-sm" title="Bullet List">
          <FontAwesomeIcon icon={faListUl} />
        </button>
        <button onClick={() => insertFormatting('ol', isEditMode)} className="p-1 sm:p-2 hover:bg-gray-200 rounded transition-colors text-xs sm:text-sm" title="Numbered List">
          <FontAwesomeIcon icon={faListOl} />
        </button>
      </div>
      <div className="flex gap-1">
        <button onClick={() => fileInputRef.current?.click()} className="p-1 sm:p-2 hover:bg-gray-200 rounded text-gray-600 transition-colors text-xs sm:text-sm" title="Add Image">
          <FontAwesomeIcon icon={faImage} />
        </button>
        <button onClick={openLinkModal} className="p-1 sm:p-2 hover:bg-gray-200 rounded text-gray-600 transition-colors text-xs sm:text-sm" title="Add Link">
          <FontAwesomeIcon icon={faLink} />
        </button>
      </div>
    </div>
  );

  const addCategory = async () => {
    if (newCategoryName.trim()) {
      const tempCategory = { 
        name: newCategoryName.trim(), 
        blogCount: 0,
        _id: `temp-${Date.now()}`
      };
      
      try {
        console.log('Adding category:', newCategoryName.trim());
        
        setLocalCategories(prev => [...prev, tempCategory]);
        
        const result = await categoryApi.createCategory(newCategoryName.trim());
        console.log('Category add result:', result);
        
        if (result.success) {
          const actualCategory = { 
            name: result.data?.name || newCategoryName.trim(), 
            blogCount: result.data?.blogCount || 0,
            _id: result.data?._id || `cat-${Date.now()}`
          };
          
          setLocalCategories(prev => 
            prev.map(cat => 
              cat._id === tempCategory._id 
                ? actualCategory
                : cat
            )
          );
          
          setNewCategoryName('');
          setIsAddingCategory(false);
          addAlert('success', 'Category added successfully!');
          
          setTimeout(() => {
            loadCategories();
          }, 100);
        } else {
          setLocalCategories(prev => prev.filter(cat => cat._id !== tempCategory._id));
          addAlert('error', result.message || 'Failed to add category');
        }
      } catch (error) {
        console.error('Error adding category:', error);
        setLocalCategories(prev => prev.filter(cat => cat._id !== tempCategory._id));
        
        if (error.message.includes('Category already exists')) {
          addAlert('error', 'This category name already exists. Please choose a different name.');
        } else {
          addAlert('error', 'Error adding category: ' + error.message);
        }
      }
    }
  };

  const deleteCategory = async (categoryName) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        setLocalCategories(prev => prev.filter(cat => cat.name !== categoryName));

        const result = await categoryApi.deleteCategory(categoryName);
        if (result.success) {
          addAlert('success', result.message || 'Category deleted successfully!');

          setTimeout(() => {
            loadCategories();
          }, 100);
        } else {
          addAlert('error', result.message || 'Failed to delete category');
          await loadCategories();
        }
      } catch (error) {
        addAlert('error', 'Error deleting category: ' + error.message);
        await loadCategories();
      }
    }
  };

  const updateCategory = async () => {
    if (editingCategory && editingCategory.name.trim()) {
      try {
        setLocalCategories(prev =>
          prev.map(cat =>
            cat.name === editingCategory.oldName
              ? { ...cat, name: editingCategory.name.trim() }
              : cat
          )
        );

        const result = await categoryApi.updateCategory(editingCategory.oldName, editingCategory.name.trim());
        if (result.success) {
          setEditingCategory(null);
          addAlert('success', result.message || 'Category updated successfully!');

          setTimeout(() => {
            loadCategories();
          }, 100);
        } else {
          addAlert('error', result.message || 'Failed to update category');
          await loadCategories();
        }
      } catch (error) {
        addAlert('error', 'Error updating category: ' + error.message);
        await loadCategories();
      }
    }
  };

  const CategorySelect = ({ value, onChange, isEditMode = false }) => {
    const selectedValue = Array.isArray(value) ? (value[0] || '') : (value || '');

    const handleChange = (e) => {
      const selectedCategory = e.target.value;
      if (selectedCategory) {
        onChange([selectedCategory]);
      } else {
        onChange([]);
      }
    };

    const handleFocus = async () => {
      if (localCategories.length === 0 && !isLoadingCategories) {
        await loadCategories();
      }
    };

    const sortedCategories = [...localCategories]
      .filter(category => category && category.name)
      .sort((a, b) => a.name.localeCompare(b.name));

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category {!selectedValue && <span className="text-red-500">*</span>}
        </label>
        <div className="flex gap-2">
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm"
            value={selectedValue}
            onChange={handleChange}
            onFocus={handleFocus}
            required
          >
            <option value="">Select a Category</option>
            {isLoadingCategories ? (
              <option value="" disabled>Loading categories...</option>
            ) : sortedCategories.length === 0 ? (
              <option value="" disabled>No categories available</option>
            ) : (
              sortedCategories.map(category => (
                <option key={category._id || category.name} value={category.name}>
                  {category.name} {category.blogCount ? `(${category.blogCount})` : ''}
                </option>
              ))
            )}
          </select>
          <button
            type="button"
            onClick={() => setIsAddingCategory(true)}
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-sm flex items-center whitespace-nowrap"
            title="Add New Category"
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>
        {!selectedValue && (
          <p className="text-red-500 text-xs mt-1">Please select a category</p>
        )}
        
        {isLoadingCategories && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg z-10">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-400 mr-2" />
            <span className="text-gray-600 text-sm">Loading categories...</span>
          </div>
        )}
      </div>
    );
  };

  const CategoryManagementModal = () => {
    if (!isAddingCategory && !editingCategory) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl max-w-sm sm:max-w-md w-full mx-2">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => {
                  setIsAddingCategory(false);
                  setEditingCategory(null);
                  setNewCategoryName('');
                }}
                className="text-gray-400 hover:text-gray-600 p-1 sm:p-2 transition-colors"
                disabled={isLoading}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <input
              type="text"
              placeholder="Enter category name..."
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors mb-4 text-sm sm:text-base"
              value={editingCategory ? editingCategory.name : newCategoryName}
              onChange={(e) =>
                editingCategory
                  ? setEditingCategory({ ...editingCategory, name: e.target.value })
                  : setNewCategoryName(e.target.value)
              }
              onKeyPress={(e) => e.key === 'Enter' && (editingCategory ? updateCategory() : addCategory())}
              autoFocus
              disabled={isLoading}
            />

            {/* Categories List */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Categories</h4>
              <div className="max-h-32 sm:max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                {localCategories.length === 0 ? (
                  <div className="p-3 text-center text-gray-500 text-sm">
                    No categories yet
                  </div>
                ) : (
                  localCategories.map(category => (
                    <div key={category._id || category.name} className="flex items-center justify-between p-2 sm:p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                      <span className="text-xs sm:text-sm text-gray-800">{category.name} ({category.blogCount || 0})</span>
                      <div className="flex space-x-1 sm:space-x-2">
                        <button
                          onClick={() => setEditingCategory({ ...category, oldName: category.name })}
                          className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
                          title="Edit Category"
                          disabled={isLoading}
                        >
                          <FontAwesomeIcon icon={faEdit} size="sm" />
                        </button>
                        <button
                          onClick={() => deleteCategory(category.name)}
                          className="text-red-600 hover:text-red-800 p-1 transition-colors"
                          title="Delete Category"
                          disabled={isLoading}
                        >
                          <FontAwesomeIcon icon={faTrash} size="sm" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => {
                  setIsAddingCategory(false);
                  setEditingCategory(null);
                  setNewCategoryName('');
                }}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm sm:text-base"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={editingCategory ? updateCategory : addCategory}
                disabled={(editingCategory ? !editingCategory.name.trim() : !newCategoryName.trim()) || isLoading}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                    {editingCategory ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  editingCategory ? 'Update' : 'Add'
                )} Category
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Simplified Blog Card Component for Manage Posts
  const BlogCard = ({ blog }) => {
    const hasVideo = blog.videoUrl || blog.content?.includes('![video](');
    const hasImage = blog.imageUrl || blog.content?.includes('![') && !blog.content?.includes('![video](');

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300">
        <div className="relative">
          {/* Image Thumbnail */}
          {hasImage && (
            <div className="h-24 sm:h-32 bg-gray-200 overflow-hidden">
              <img src={blog.imageUrl} alt={blog.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* No media placeholder */}
          {!hasImage && (
            <div className="h-24 sm:h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <FontAwesomeIcon icon={faImage} className="text-gray-400 text-lg sm:text-xl" />
            </div>
          )}

          {blog.featured && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
              Featured
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className={`px-2 py-1 text-xs rounded-full ${blog.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
              {blog.status}
            </span>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <span>{blog.readTime || '1'} min</span>
            </div>
          </div>

          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight text-sm sm:text-base">
            {blog.title}
          </h3>

          {/* Display category */}
          {blog.category && blog.category[0] && (
            <div className="mb-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {blog.category[0]}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <div className="flex items-center space-x-2">
              <span className="flex items-center">
                <FontAwesomeIcon icon={faCalendar} className="mr-1" />
                {new Date(blog.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            <div className="flex space-x-1 sm:space-x-2">
              <button
                onClick={() => setViewingBlog(blog)}
                className="text-blue-600 hover:text-blue-800 p-1 rounded-lg hover:bg-blue-50 transition-colors text-xs sm:text-sm flex items-center"
                title="View Post"
              >
                <FontAwesomeIcon icon={faEye} className="mr-1" />
                View
              </button>
              <button
                onClick={() => setEditingBlog(blog)}
                className="text-gray-600 hover:text-black p-1 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm flex items-center"
                title="Edit Post"
              >
                <FontAwesomeIcon icon={faEdit} className="mr-1" />
                Edit
              </button>
            </div>

            <div className="flex space-x-1">
              <button onClick={() => toggleFeatured(blog._id)} className={`p-1 rounded-lg transition-colors ${blog.featured ? 'text-yellow-600 hover:text-yellow-700 bg-yellow-50' : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                }`} title={blog.featured ? 'Remove featured' : 'Make featured'}>
                <FontAwesomeIcon icon={faPalette} size="xs" />
              </button>
              <button onClick={() => togglePublishStatus(blog._id)} className="text-gray-400 hover:text-green-600 p-1 rounded-lg hover:bg-green-50 transition-colors" title={blog.status === 'published' ? 'Unpublish' : 'Publish'}>
                <FontAwesomeIcon icon={blog.status === 'published' ? faEyeSlash : faEye} size="xs" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setBlogToDelete(blog);
                  setDeleteModalOpen(true);
                }}
                className="text-gray-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <FontAwesomeIcon icon={faTrash} size="xs" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Search and Filter Component
  const EnhancedSearchFilter = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="relative sm:col-span-2 lg:col-span-2">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search posts by title, content, or tags..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value='published'>Published</option>
          <option value='draft'>Draft</option>
        </select>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm"
          value={contentTypeFilter}
          onChange={(e) => setContentTypeFilter(e.target.value)}
        >
          <option value="all">All Content</option>
          <option value="image">Image Posts</option>
          <option value="text-only">Text Only</option>
        </select>
      </div>
      <div className="mt-3 text-sm text-gray-600 flex items-center">
        <FontAwesomeIcon icon={faGlobe} className="mr-2" />
        {blogs.length} posts
        {contentTypeFilter !== 'all' && (
          <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
            {contentTypeFilter === 'image' && 'Image Only'}
            {contentTypeFilter === 'text-only' && 'Text Only'}
          </span>
        )}
      </div>
    </div>
  );

  // Enhanced LinkModal with complete isolation
  const LinkModal = () => {
    const [localLinkData, setLocalLinkData] = useState({ text: '', url: '' });

    useEffect(() => {
      if (linkModalOpen) {
        const textarea = contentTextareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const selectedText = newBlog.content.substring(start, end);
          setLocalLinkData({
            text: selectedText || '',
            url: ''
          });
        }
      }
    }, [linkModalOpen]);

    const handleInsertLink = () => {
      if (localLinkData.url) {
        const textarea = contentTextareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = newBlog.content.substring(start, end);

        const linkText = localLinkData.text || selectedText || 'Link';
        const linkMarkdown = `[${linkText}](${localLinkData.url})`;

        const newContent = newBlog.content.substring(0, start) + linkMarkdown + newBlog.content.substring(end);
        setNewBlog({ ...newBlog, content: newContent });

        setLinkModalOpen(false);
        addAlert('success', 'Link inserted successfully!');

        setTimeout(() => {
          textarea.focus();
          const newPosition = start + linkMarkdown.length;
          textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleInsertLink();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setLinkModalOpen(false);
      }
    };

    if (!linkModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
        <div
          className="bg-white rounded-lg sm:rounded-xl shadow-2xl max-w-sm sm:max-w-md w-full mx-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Insert Link</h3>
              <button
                onClick={() => setLinkModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 sm:p-2 transition-colors"
                type="button"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Link Text</label>
              <input
                type="text"
                placeholder="Enter link text..."
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base"
                value={localLinkData.text}
                onChange={(e) => setLocalLinkData({ ...localLinkData, text: e.target.value })}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
              <input
                type="url"
                placeholder="https://example.com"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base"
                value={localLinkData.url}
                onChange={(e) => setLocalLinkData({ ...localLinkData, url: e.target.value })}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>

          <div className="p-4 sm:p-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setLinkModalOpen(false)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleInsertLink}
                disabled={!localLinkData.url}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                type="button"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // View Blog Modal
  const ViewBlogModal = () => {
    if (!viewingBlog) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl max-w-2xl sm:max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-2">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">View Blog Post</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingBlog(viewingBlog)}
                  className="px-3 sm:px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                >
                  Edit
                </button>
                <button onClick={() => setViewingBlog(null)} className="text-gray-400 hover:text-gray-600 p-1 sm:p-2 transition-colors">
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {viewingBlog.imageUrl && (
                <div className="w-full h-48 sm:h-64 bg-gray-200 overflow-hidden">
                  <img src={viewingBlog.imageUrl} alt={viewingBlog.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  <span className="flex items-center">
                    <FontAwesomeIcon icon={faCalendar} className="mr-1" />
                    {new Date(viewingBlog.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center">
                    <FontAwesomeIcon icon={faUser} className="mr-1" />
                    {viewingBlog.author || 'Admin'}
                  </span>
                  <span className="flex items-center">
                    <FontAwesomeIcon icon={faClock} className="mr-1" />
                    {viewingBlog.readTime} min read
                  </span>
                  {viewingBlog.featured && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                      Featured
                    </span>
                  )}
                  {viewingBlog.category && viewingBlog.category[0] && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                      {viewingBlog.category[0]}
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">{viewingBlog.title}</h1>

                <div className="text-gray-700">
                  {viewingBlog.content ? (
                    <MarkdownRenderer content={viewingBlog.content} />
                  ) : (
                    <p className="text-gray-500 italic">No content available.</p>
                  )}
                </div>

                {viewingBlog.tags && viewingBlog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
                    {viewingBlog.tags.map(tag => (
                      <span key={tag} className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs sm:text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DeleteConfirmationModal = () => {
    if (!deleteModalOpen || !blogToDelete) return null;

    const handleDelete = async () => {
      setIsLoading(true);
      try {
        const result = await blogApi.deleteBlog(blogToDelete._id);
        if (result.success) {
          setBlogs(blogs.filter(blog => blog._id !== blogToDelete._id));
          addAlert('success', 'Blog deleted successfully!');
          await loadCategories();
        } else {
          addAlert('error', result.message || 'Failed to delete blog');
        }
      } catch (error) {
        addAlert('error', 'Error deleting blog: ' + error.message);
      } finally {
        setIsLoading(false);
        setDeleteModalOpen(false);
        setBlogToDelete(null);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl max-w-sm sm:max-w-md w-full mx-2">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <FontAwesomeIcon icon={faWarning} className="text-red-600 text-lg sm:text-xl" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Delete Blog Post</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setBlogToDelete(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 sm:p-2 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <div className="flex items-start space-x-3">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Warning: Permanent Deletion</h4>
                  <p className="text-xs sm:text-sm text-red-700 mt-1">
                    You are about to delete "<span className="font-semibold">{blogToDelete.title}</span>".
                    This will permanently remove the blog post and all its contents.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Blog Details:</h5>
              <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Title:</span>
                  <span className="font-medium">{blogToDelete.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${blogToDelete.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                    }`}>
                    {blogToDelete.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span>{new Date(blogToDelete.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setBlogToDelete(null);
                }}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                    Delete Post
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Edit Modal (video upload removed)
  const renderEditSection = () => {
    if (!editingBlog) return null;

    const handleEditImageUpload = (event) => {
      const file = event.target.files[0];
      if (file && file.type.startsWith('image/')) {
        currentFileRef.current = file;
        const reader = new FileReader();
        reader.onload = (e) => {
          setEditingBlog({ ...editingBlog, imageUrl: e.target.result });
          addAlert('success', 'Image selected for upload!');
        };
        reader.readAsDataURL(file);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-40">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl max-w-2xl sm:max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-2">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Edit Blog Post</h3>
              <button onClick={() => setEditingBlog(null)} className="text-gray-400 hover:text-gray-600 p-1 sm:p-2 transition-colors">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <input
              type="text"
              placeholder="Blog post title..."
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-lg font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm sm:text-base"
              value={editingBlog.title}
              onChange={(e) => setEditingBlog({ ...editingBlog, title: e.target.value })}
            />

            <FormattingToolbar isEditMode={true} />

            <textarea
              ref={editContentTextareaRef}
              placeholder="Blog content..."
              rows="6"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors resize-none text-sm sm:text-base leading-relaxed"
              value={editingBlog.content}
              onChange={(e) => setEditingBlog({ ...editingBlog, content: e.target.value })}
            />

            {/* Image Upload Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Featured Image
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faUpload} />
                  Upload Image
                </button>
                {editingBlog.imageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBlog({ ...editingBlog, imageUrl: '' });
                      addAlert('info', 'Image removed');
                    }}
                    className="px-3 sm:px-4 py-2 sm:py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-xs sm:text-sm flex items-center"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                )}
              </div>
              {editingBlog.imageUrl && (
                <div className="mt-2">
                  <img 
                    src={editingBlog.imageUrl} 
                    alt="Current featured" 
                    className="w-full h-24 sm:h-32 object-cover rounded-lg border"
                  />
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    Current image: {editingBlog.imageUrl.substring(0, 50)}...
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <CategorySelect
                value={editingBlog.category}
                onChange={(newCategoryArray) => setEditingBlog({ ...editingBlog, category: newCategoryArray })}
                isEditMode={true}
              />

              <div>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add tags..."
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-xs sm:text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && e.target.value.trim() && setEditingBlog({
                      ...editingBlog,
                      tags: [...(editingBlog.tags || []), e.target.value.trim()]
                    })}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {editingBlog.tags?.map((tag, index) => (
                    <span key={`${tag}-${index}`} className="px-2 sm:px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs flex items-center">
                      {tag}
                      <button onClick={() => {
                        const newTags = editingBlog.tags.filter((_, i) => i !== index);
                        setEditingBlog({ ...editingBlog, tags: newTags });
                      }} className="ml-1 sm:ml-2 hover:text-gray-600 transition-colors">
                        <FontAwesomeIcon icon={faTimes} size="xs" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center text-gray-700 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={editingBlog.featured || false}
                  onChange={(e) => setEditingBlog({ ...editingBlog, featured: e.target.checked })}
                  className="w-4 h-4 text-black rounded focus:ring-black mr-2"
                />
                Featured Post
              </label>
            </div>
          </div>

          <div className="p-4 sm:p-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button onClick={() => setEditingBlog(null)} className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base">
                Cancel
              </button>
              <button onClick={updateBlog} disabled={isLoading} className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base">
                {isLoading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" /> : null}
                Update Post
              </button>
            </div>
          </div>

          {/* Hidden file input for edit mode */}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleEditImageUpload} 
          />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4">
      {/* Alerts */}
      {alerts.map(alert => (
        <CustomAlert key={alert.id} type={alert.type} message={alert.message} onClose={() => removeAlert(alert.id)} />
      ))}

      {/* Category Management Modal */}
      <CategoryManagementModal />

      {/* Link Modal */}
      <LinkModal />

      {/* View Blog Modal */}
      <ViewBlogModal />

      <DeleteConfirmationModal />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto">
        <button
          className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${activeTab === 'create' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('create')}
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Write New Post
        </button>
        <button
          className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${activeTab === 'manage' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-gray-700'
            }`}
          onClick={() => setActiveTab('manage')}
        >
          <FontAwesomeIcon icon={faEdit} className="mr-2" />
          Manage Posts ({blogs.length})
        </button>
      </div>

      {activeTab === 'create' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Editor */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <input
                type="text"
                placeholder="Amazing blog post title..."
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-lg sm:text-xl font-bold border-0 focus:ring-0 placeholder-gray-400 bg-transparent text-sm sm:text-base"
                value={newBlog.title}
                onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
              />

              <FormattingToolbar />

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-black h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              <textarea
                ref={contentTextareaRef}
                placeholder="Start writing your amazing blog post... (Use **bold**, *italic*, # heading, - lists, [text](url) for links)"
                rows="8"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black resize-none font-sans text-sm sm:text-base leading-relaxed transition-colors"
                value={newBlog.content}
                onChange={(e) => setNewBlog({ ...newBlog, content: e.target.value })}
              />

              {renderMediaPreview()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt</label>
                  <textarea
                    placeholder="Short description..."
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-xs sm:text-sm"
                    value={newBlog.excerpt}
                    onChange={(e) => setNewBlog({ ...newBlog, excerpt: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
                  <textarea
                    placeholder="SEO description..."
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-xs sm:text-sm"
                    value={newBlog.metaDescription}
                    onChange={(e) => setNewBlog({ ...newBlog, metaDescription: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                <CategorySelect
                  value={newBlog.category}
                  onChange={(newCategoryArray) => setNewBlog({ ...newBlog, category: newCategoryArray })}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add tags..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-xs sm:text-sm"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <button onClick={addTag} className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-xs sm:text-sm">
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newBlog.tags.map(tag => (
                      <span key={`${tag}-${Date.now()}`} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs flex items-center">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="ml-1 hover:text-gray-600 transition-colors">
                          <FontAwesomeIcon icon={faTimes} size="xs" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <label className="flex items-center text-gray-600 hover:text-black cursor-pointer transition-colors text-xs sm:text-sm">
                    <input
                      type="checkbox"
                      checked={newBlog.featured}
                      onChange={(e) => setNewBlog({ ...newBlog, featured: e.target.checked })}
                      className="mr-2 rounded focus:ring-black"
                    />
                    Featured Post
                  </label>
                  <button onClick={() => setShowPreview(!showPreview)} className="flex items-center text-gray-600 hover:text-black transition-colors text-xs sm:text-sm">
                    <FontAwesomeIcon icon={showPreview ? faEyeSlash : faEye} className="mr-2" />
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto mt-3 sm:mt-0">
                  <button onClick={() => quickAddBlog('draft')} disabled={!newBlog.content.trim() || isLoading || !newBlog.category || newBlog.category.length === 0} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm">
                    {isLoading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" /> : null}
                    Save Draft
                  </button>
                  <button onClick={() => quickAddBlog('published')} disabled={!newBlog.content.trim() || isLoading || !newBlog.category || newBlog.category.length === 0} className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm">
                    {isLoading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" /> : <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />}
                    Publish Now
                  </button>
                </div>
              </div>

              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Live Preview</h3>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {newBlog.imageUrl && (
                    <div className="w-full h-32 sm:h-48 bg-gray-200 overflow-hidden">
                      <img src={newBlog.imageUrl} alt={newBlog.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-3 sm:p-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mb-2 sm:mb-3">
                      <span>{newBlog.author}</span>
                      <span>{new Date().toLocaleDateString()}</span>
                      <span>{newBlog.readTime} min read</span>
                      {newBlog.category && newBlog.category[0] && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {newBlog.category[0]}
                        </span>
                      )}
                    </div>
                    <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{newBlog.title || "Your Blog Title"}</h1>
                    <div className="text-gray-700">
                      {newBlog.content ? (
                        <MarkdownRenderer content={newBlog.content} />
                      ) : (
                        <p className="text-gray-500 italic">Your content will appear here...</p>
                      )}
                    </div>
                    {newBlog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
                        {newBlog.tags.map(tag => (
                          <span key={`${tag}-${Date.now()}`} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Enhanced Search and Filter */}
          <EnhancedSearchFilter />

          {/* Loading State */}
          {(isLoading || isLoadingBlogs) && (
            <div className="flex justify-center items-center py-6 sm:py-8">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl sm:text-2xl text-gray-400 mr-2 sm:mr-3" />
              <span className="text-gray-600 text-sm sm:text-base">Loading...</span>
            </div>
          )}

          {/* Blog Grid */}
          {!isLoading && !isLoadingBlogs && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {blogs.map(blog => (
                <BlogCard key={blog._id} blog={blog} />
              ))}
            </div>
          )}

          {!isLoading && !isLoadingBlogs && blogs.length === 0 && (
            <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <FontAwesomeIcon icon={faSearch} className="text-3xl sm:text-4xl text-gray-400 mb-3 sm:mb-4" />
              <h4 className="text-base sm:text-lg font-medium text-gray-600 mb-2">No posts found</h4>
              <p className="text-gray-500 text-sm sm:text-base">Try adjusting your search or create a new post.</p>
            </div>
          )}
        </div>
      )}

      {renderEditSection()}
    </div>
  );
};

export default BlogsTab;