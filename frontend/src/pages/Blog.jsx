import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import Title from "../components/Title";
import Loader from "../components/Loader";
import { 
  FaCalendarAlt, 
  FaUser, 
  FaFire, 
  FaTag, 
  FaFilter,
  FaTimes,
  FaSortAmountDown,
  FaChevronRight,
  FaSearch,
  FaStar,
  FaBookmark,
  FaEye,
  FaShareAlt
} from "react-icons/fa";

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortType, setSortType] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [backendCategories, setBackendCategories] = useState([]);
  const [backendTags, setBackendTags] = useState([]);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Fetch blogs from backend API
  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/blogs?status=published`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch blogs: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        const blogsData = result.data || [];
        setBlogs(blogsData);
        
        // Extract unique categories and tags
        const categories = new Set();
        const tags = new Set();
        
        blogsData.forEach(blog => {
          if (blog.category) {
            if (Array.isArray(blog.category)) {
              blog.category.forEach(cat => categories.add(cat));
            } else {
              categories.add(blog.category);
            }
          }
          
          if (blog.tags && Array.isArray(blog.tags)) {
            blog.tags.forEach(tag => tags.add(tag));
          }
        });
        
        setBackendCategories(Array.from(categories).map(name => ({ id: name, name })));
        setBackendTags(Array.from(tags).map(name => ({ id: name, name })));
      } else {
        throw new Error(result.message || 'Failed to fetch blogs');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    if (backendUrl) {
      fetchBlogs();
    } else {
      setError('Backend URL not configured');
      setLoading(false);
    }
  }, [backendUrl, fetchBlogs]);

  // Toggle functions
  const toggleCategory = useCallback((categoryName) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName) ? prev.filter(c => c !== categoryName) : [...prev, categoryName]
    );
  }, []);

  const toggleTag = useCallback((tagName) => {
    setSelectedTags(prev => 
      prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]
    );
  }, []);

  // Reset all filters
  const resetAllFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedTags([]);
    setSortType('latest');
    setSearchQuery('');
  }, []);

  // Apply filters and sorting
  const filteredBlogs = useMemo(() => {
    let filtered = [...blogs];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(blog =>
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.content?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(blog => {
        if (!blog.category) return false;
        const blogCategories = Array.isArray(blog.category) ? blog.category : [blog.category];
        return selectedCategories.some(cat => blogCategories.includes(cat));
      });
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(blog => {
        if (!blog.tags || !Array.isArray(blog.tags)) return false;
        return selectedTags.some(tag => blog.tags.includes(tag));
      });
    }

    // Apply sorting
    switch (sortType) {
      case 'popular':
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'trending':
        filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case 'featured':
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      default: // 'latest'
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    return filtered;
  }, [blogs, searchQuery, selectedCategories, selectedTags, sortType]);

  // Get blog counts for categories
  const getCategoryBlogCount = useCallback((categoryName) => {
    return blogs.filter(blog => {
      if (!blog.category) return false;
      const blogCategories = Array.isArray(blog.category) ? blog.category : [blog.category];
      return blogCategories.includes(categoryName);
    }).length;
  }, [blogs]);

  // Get blog counts for tags
  const getTagBlogCount = useCallback((tagName) => {
    return blogs.filter(blog => {
      if (!blog.tags || !Array.isArray(blog.tags)) return false;
      return blog.tags.includes(tagName);
    }).length;
  }, [blogs]);

  // Get featured blogs
  const featuredBlogs = useMemo(() => 
    filteredBlogs.filter(blog => blog.featured).slice(0, 6),
    [filteredBlogs]
  );

  // Get latest blogs (excluding featured)
  const latestBlogs = useMemo(() => 
    filteredBlogs.filter(blog => !blog.featured).slice(0, 12),
    [filteredBlogs]
  );

  // Get trending blogs
  const trendingBlogs = useMemo(() => 
    [...filteredBlogs]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5),
    [filteredBlogs]
  );

  // Check if any filters are active
  const hasActiveFilters = selectedCategories.length > 0 || 
                          selectedTags.length > 0 || 
                          sortType !== 'latest' || 
                          searchQuery;

  // Sort options
  const sortOptions = [
    { value: 'latest', label: 'Latest', icon: <FaCalendarAlt className="w-3 h-3" /> },
    { value: 'popular', label: 'Most Popular', icon: <FaEye className="w-3 h-3" /> },
    { value: 'trending', label: 'Trending', icon: <FaFire className="w-3 h-3" /> },
    { value: 'featured', label: 'Featured', icon: <FaStar className="w-3 h-3" /> },
    { value: 'oldest', label: 'Oldest', icon: <FaSortAmountDown className="w-3 h-3" /> }
  ];

  // Show loader while page is loading
  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Articles</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-red-600 text-white rounded-3xl hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Title text1={"our"} text2={"Blogs"} />
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Expert tips, natural ingredient insights, and wholesome wellness advice for a healthy, nourished life.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 px-4 py-3 bg-black text-white rounded-xl w-full justify-center"
            >
              <FaFilter className="w-4 h-4" />
              {showFilter ? 'Hide Filters' : 'Show Filters'}
              {hasActiveFilters && (
                <span className="ml-2 bg-white text-black text-xs px-2 py-0.5 rounded-full">
                  {selectedCategories.length + selectedTags.length}
                </span>
              )}
            </button>
          </div>

          {/* Filters Sidebar */}
          <div className={`lg:w-64 xl:w-72 ${showFilter ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
              {/* Filters Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaFilter className="w-4 h-4" />
                  Filters
                </h3>
                {hasActiveFilters && (
                  <button
                    onClick={resetAllFilters}
                    className="text-sm text-black hover:text-gray-600 underline"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Search Input */}
              <div className="mb-6">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>

              {/* Active Filters */}
              {hasActiveFilters && (
                <div className="mb-6 pb-6 border-b border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {selectedCategories.map(cat => (
                      <span 
                        key={cat} 
                        className="bg-gray-100 px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5"
                      >
                        {cat}
                        <button 
                          onClick={() => setSelectedCategories(prev => prev.filter(c => c !== cat))}
                          className="text-gray-500 hover:text-gray-700 text-xs"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {selectedTags.map(tag => (
                      <span 
                        key={tag} 
                        className="bg-gray-100 px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5"
                      >
                        {tag}
                        <button 
                          onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                          className="text-gray-500 hover:text-gray-700 text-xs"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {searchQuery && (
                      <span className="bg-gray-100 px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5">
                        Search: "{searchQuery}"
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="text-gray-500 hover:text-gray-700 text-xs"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Sort Options */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Sort By</h4>
                <div className="space-y-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSortType(option.value)}
                      className={`flex items-center gap-2 w-full p-2 rounded-lg text-sm transition-all duration-200 ${
                        sortType === option.value
                          ? 'bg-black text-white'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories Section */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <FaTag className="w-3 h-3" />
                  Categories
                </h4>
                <div className="space-y-2">
                  {backendCategories.length > 0 ? (
                    backendCategories.map(cat => {
                      const blogCount = getCategoryBlogCount(cat.name);
                      const isSelected = selectedCategories.includes(cat.name);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => toggleCategory(cat.name)}
                          className={`flex items-center justify-between w-full p-2 rounded-lg transition-all duration-200 ${
                            isSelected 
                              ? 'bg-black text-white' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 flex items-center justify-center rounded border ${
                              isSelected ? 'border-white' : 'border-gray-300'
                            }`}>
                              {isSelected && <span className="text-xs">✓</span>}
                            </div>
                            <span className="text-sm">{cat.name}</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isSelected 
                              ? 'bg-white text-black' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {blogCount}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-gray-500 text-sm p-2">No categories available</div>
                  )}
                </div>
              </div>

              {/* Tags Section */}
              {backendTags.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Popular Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {backendTags.slice(0, 10).map(tag => {
                      const blogCount = getTagBlogCount(tag.name);
                      const isSelected = selectedTags.includes(tag.name);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.name)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                            isSelected
                              ? 'bg-black text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title={`${blogCount} articles`}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Results Count */}
              <div className="pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-black">{filteredBlogs.length}</span> of{" "}
                  <span className="font-semibold text-black">{blogs.length}</span> articles
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Featured Section */}
            {featuredBlogs.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-black pl-3">
                    Featured Guides
                  </h2>
                  <div className="text-sm text-gray-100 bg-black px-3 py-1 rounded-3xl">
                    Must Read
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {featuredBlogs.map((blog, index) => (
                    <FeaturedCard key={blog._id} blog={blog} isMain={index === 0} />
                  ))}
                </div>
              </section>
            )}

            {/* Latest Articles */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-black pl-3">
                  {searchQuery ? 'Search Results' : 'Latest Articles'}
                </h2>
                <div className="text-sm text-gray-600">
                  {filteredBlogs.length} articles
                </div>
              </div>
              
              {latestBlogs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {latestBlogs.map((blog, index) => (
                    <BlogCard key={blog._id} blog={blog} featured={index < 2} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-300">
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    {searchQuery ? 'No articles found' : 'No articles yet'}
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery ? 'Try different keywords or clear filters' : 'Check back later for new insights.'}
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={resetAllFilters}
                      className="mt-4 px-6 py-2 bg-black text-white hover:bg-gray-900 transition-colors rounded-lg"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* Trending Sidebar (for larger screens) */}
            {trendingBlogs.length > 0 && (
              <div className="hidden lg:block lg:col-span-1">
                <div className="bg-black/10 rounded-3xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaFire className="text-green-600" />
                    Trending Now
                  </h3>
                  <div className="space-y-4">
                    {trendingBlogs.map((blog, index) => (
                      <TrendingStory key={blog._id} blog={blog} rank={index + 1} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Featured Card Component
const FeaturedCard = ({ blog, isMain }) => {
  const handleImageError = useCallback((e) => {
    e.target.style.display = 'none';
    const nextSibling = e.target.nextSibling;
    if (nextSibling) {
      nextSibling.style.display = 'block';
    }
  }, []);

  if (isMain) {
    return (
      <div className="lg:col-span-2 group">
        <Link to={`/blog/${blog._id}`} className="block">
          <div className="relative overflow-hidden rounded-3xl bg-gray-900">
            {blog.imageUrl ? (
              <img
                src={blog.imageUrl}
                alt={blog.title}
                className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500 rounded-3xl"
                loading="lazy"
                decoding="async"
                width={800}
                height={400}
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-80 bg-gradient-to-br from-gray-800 to-gray-600 flex items-center justify-center rounded-3xl">
                <FaTag className="text-gray-400 text-4xl" aria-hidden="true" />
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-3xl" />
            
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-red-600 text-white px-3 py-1 rounded-3xl text-sm font-medium">
                  Featured
                </span>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-gray-300 transition-colors">
                {blog.title}
              </h3>
              
              <p className="text-gray-200 mb-4 line-clamp-2">
                {blog.excerpt || blog.metaDescription}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-300">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <FaUser className="text-xs" aria-hidden="true" />
                    {blog.author || 'Skincare Expert'}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaCalendarAlt className="text-xs" aria-hidden="true" />
                    {new Date(blog.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {blog.views && (
                  <span className="flex items-center gap-1">
                    <FaEye className="text-xs" aria-hidden="true" />
                    {blog.views} views
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="group">
      <Link to={`/blog/${blog._id}`} className="block">
        <div className="relative overflow-hidden rounded-3xl bg-white border border-gray-200 hover:shadow-lg transition-all duration-300">
          {blog.imageUrl ? (
            <img
              src={blog.imageUrl}
              alt={blog.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500 rounded-3xl"
              loading="lazy"
              decoding="async"
              width={400}
              height={192}
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-3xl">
              <FaTag className="text-gray-400 text-xl" aria-hidden="true" />
            </div>
          )}
          
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded-3xl">
                FEATURED
              </span>
            </div>
            
            <h4 className="font-bold text-gray-900 mb-2 group-hover:text-gray-500 transition-colors line-clamp-2">
              {blog.title}
            </h4>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
              {blog.views && (
                <span className="flex items-center gap-1">
                  <FaEye className="text-xs" />
                  {blog.views}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

// Blog Card Component
const BlogCard = ({ blog, featured = false }) => {
  const handleImageError = useCallback((e) => {
    e.target.style.display = 'none';
    const nextSibling = e.target.nextSibling;
    if (nextSibling) {
      nextSibling.style.display = 'block';
    }
  }, []);

  if (featured) {
    return (
      <div className="group">
        <Link to={`/blog/${blog._id}`} className="block">
          <div className="flex flex-col sm:flex-row gap-4 bg-white rounded-3xl border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="sm:w-2/5 relative">
              {blog.imageUrl ? (
                <img
                  src={blog.imageUrl}
                  alt={blog.title}
                  className="w-full h-48 sm:h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-3xl"
                  loading="lazy"
                  decoding="async"
                  width={300}
                  height={200}
                  onError={handleImageError}
                />
              ) : (
                <div className="w-full h-48 sm:h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-3xl">
                  <FaTag className="text-gray-400 text-xl" aria-hidden="true" />
                </div>
              )}
            </div>
            
            <div className="sm:w-3/5 p-4">
              <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-gray-500 transition-colors line-clamp-2">
                {blog.title}
              </h3>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                {blog.excerpt || blog.metaDescription}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <FaUser className="text-xs" aria-hidden="true" />
                    {blog.author || 'Skincare Expert'}
                  </span>
                  <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                </div>
                {blog.views && (
                  <span className="flex items-center gap-1">
                    <FaEye className="text-xs" />
                    {blog.views}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="group">
      <Link to={`/blog/${blog._id}`} className="block">
        <div className="bg-white rounded-3xl border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden">
          {blog.imageUrl && (
            <div className="relative overflow-hidden">
              <img
                src={blog.imageUrl}
                alt={blog.title}
                className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500 rounded-3xl"
                loading="lazy"
                decoding="async"
                width={400}
                height={160}
                onError={handleImageError}
              />
            </div>
          )}
          
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              {blog.category && (
                <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-3xl">
                  {Array.isArray(blog.category) ? blog.category[0] : blog.category}
                </span>
              )}
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-gray-500 transition-colors line-clamp-2">
              {blog.title}
            </h3>
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {blog.excerpt || blog.metaDescription}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
              <div className="flex items-center gap-3">
                {blog.views && (
                  <span className="flex items-center gap-1">
                    <FaEye className="text-xs" />
                    {blog.views}
                  </span>
                )}
                {blog.likes && (
                  <span className="flex items-center gap-1">
                    <FaStar className="text-xs" />
                    {blog.likes}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

// Trending Story Component
const TrendingStory = ({ blog, rank }) => {
  return (
    <Link to={`/blog/${blog._id}`} className="flex items-start gap-3 group hover:bg-gray-50 p-2 rounded-3xl transition-colors">
      <div className="flex-shrink-0 w-6 h-6 bg-gray-200 text-gray-700 rounded-3xl text-xs font-bold flex items-center justify-center">
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="font-medium text-gray-900 group-hover:text-gray-500 transition-colors line-clamp-2 text-sm">
          {blog.title}
        </h5>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
          {blog.views && (
            <span className="flex items-center gap-1">
              <FaEye className="text-xs" />
              {blog.views}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default Blog;