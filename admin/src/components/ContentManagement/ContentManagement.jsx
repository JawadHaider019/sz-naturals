import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolder,
  faComment,
  faBookOpen,
  faReply,
  faCog,
  faImages,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

// Import tab components
import CategoriesTab from "./Tabs/CategoriesTab.jsx";
import TestimonialsTab from "./Tabs/TestimonialsTab.jsx";
import BlogsTab from "./Tabs/BlogsTab.jsx";
import CommentsTab from "./Tabs/CommentsTab.jsx";
import OtherTab from "./Tabs/OtherTab.jsx";
import { BannerManager } from "./Tabs/BannerTab.jsx";
import TeamsTab from "./Tabs/TeamsTab.jsx"; 

const ContentManagement = () => {
  const [activeTab, setActiveTab] = useState("categories");

  // All data states (initially empty)
  const [categories, setCategories] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [comments, setComments] = useState([]);
  const [teams, setTeams] = useState([]); // New state for teams

  const [deliverySettings, setDeliverySettings] = useState({
    mode: "fixed",
    fixedCharge: 0,
    apiUrl: "",
    freeDeliveryAbove: 0,
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const previewUrlsRef = useRef([]);

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      previewUrlsRef.current = [];
    };
  }, []);


  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "categories":
        return (
          <CategoriesTab categories={categories} setCategories={setCategories} />
        );
      case "blogs":
        return (
          <BlogsTab
            blogs={blogs}
            setBlogs={setBlogs}
            categories={categories}
          />
        );
      case "banner":
        return <BannerManager />;
      case "testimonials":
        return (
          <TestimonialsTab
            testimonials={testimonials}
            setTestimonials={setTestimonials}
          />
        );
      case "comments":
        return (
          <CommentsTab comments={comments} setComments={setComments} />
        );
      case "teams": // New case for teams
        return (
          <TeamsTab teams={teams} setTeams={setTeams} />
        );
      case "other":
        return (
          <OtherTab
            deliverySettings={deliverySettings}
            setDeliverySettings={setDeliverySettings}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg md:rounded-xl lg:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm md:shadow-md lg:shadow-lg border border-gray-100 mt-4 md:mt-6">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">
        Content Management
      </h2>

      {/* Tabs - Mobile responsive with horizontal scroll */}
      <div className="relative">
        <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 mb-4 md:mb-6 pb-2">
          <div className="flex space-x-1 md:space-x-0 min-w-max">
            {[
              { id: "categories", name: "Categories", icon: faFolder },
              { id: "blogs", name: "Blogs", icon: faBookOpen },
              { id: "banner", name: "Banner", icon: faImages },
              { id: "testimonials", name: "Testimonials", icon: faComment },
              { id: "comments", name: "Comments", icon: faReply },
              { id: "teams", name: "Teams", icon: faUsers }, // New tab
              { id: "other", name: "Other", icon: faCog },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`flex-shrink-0 px-3 py-2 text-sm md:text-base font-medium flex items-center whitespace-nowrap rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "text-black bg-gray-100 md:bg-transparent md:border-b-2 md:border-black"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <FontAwesomeIcon 
                  icon={tab.icon} 
                  className="mr-2 text-xs md:text-sm" 
                />
                <span className="hidden xs:inline">{tab.name}</span>
                <span className="xs:hidden">
                  {tab.name === 'Categories' ? 'Cat' :
                   tab.name === 'Testimonials' ? 'Test' :
                   tab.name === 'Comments' ? 'Com' : tab.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ContentManagement;