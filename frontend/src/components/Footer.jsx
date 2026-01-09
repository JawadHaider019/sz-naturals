import { Link } from "react-router-dom"
import { assets } from "../assets/assets"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { 
  faFacebookF, 
  faInstagram, 
  faWhatsapp, 
  faTiktok,
} from "@fortawesome/free-brands-svg-icons"
import { 
  faEnvelope, 
  faPhone, 
  faMapMarkerAlt,
  faArrowRight
} from "@fortawesome/free-solid-svg-icons"
import { useState, useEffect } from "react"
import axios from "axios"

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Footer = () => {
    const [businessInfo, setBusinessInfo] = useState({
        company: {
            name: "SZ Naturals",
            description: "Handmade organic skincare crafted from pure, natural ingredients — gentle on your skin and kind to the planet.",
            foundedYear: 2024
        },
        contact: {
            customerSupport: {
                email: "info.sznaturals@gmail.com",
                phone: "+923134471652",
            }
        },
        location: {
            displayAddress: "Pakistan",
            googleMapsLink: ""
        },
        socialMedia: {
            facebook: "",
            instagram: "",
            tiktok: "",
            whatsapp: ""
        },
        logos: {
            website: { url: "" }
        }
    })
    const [loading, setLoading] = useState(true)
    const [email, setEmail] = useState("")

    useEffect(() => {
        const fetchBusinessDetails = async () => {
            try {
                const response = await axios.get(`${backendUrl}/api/business-details`)
                if (response.data.success && response.data.data) {
                    setBusinessInfo(response.data.data)
                }
            } catch (error) {
                // Error handling
            } finally {
                setLoading(false)
            }
        }

        if (backendUrl) {
            fetchBusinessDetails()
        } else {
            setLoading(false)
        }
    }, [])

    const socialPlatforms = [
        { 
            key: 'facebook', 
            icon: faFacebookF, 
            color: "bg-black hover:bg-[#1877F2] text-white hover:text-white",
            label: "Facebook"
        },
        { 
            key: 'instagram', 
            icon: faInstagram, 
            color: "bg-black hover:bg-gradient-to-r hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#FCAF45] text-white hover:text-white",
            label: "Instagram"
        },
        { 
            key: 'tiktok', 
            icon: faTiktok, 
            color: "bg-black hover:bg-white text-white hover:text-black",
            label: "TikTok"
        },
        { 
            key: 'whatsapp', 
            icon: faWhatsapp, 
            color: "bg-black hover:bg-[#25D366] text-white hover:text-white",
            label: "WhatsApp"
        }
    ]

    const currentYear = new Date().getFullYear()

    const LogoDisplay = () => {
        if (businessInfo.logos?.website?.url) {
            return (
                <img 
                    src={businessInfo.logos.website.url} 
                    alt={`${businessInfo.company?.name} Logo`} 
                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain"
                    onError={(e) => {
                        e.target.src = assets.logo
                    }}
                />
            )
        }
        
        return (
            <img 
                src={assets.logo} 
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24" 
                alt="SZ Naturals Logo" 
            />
        )
    }

    const handleSubscribe = (e) => {
        e.preventDefault()
        // Add subscription logic here
        console.log("Subscribed with email:", email)
        setEmail("")
    }

    if (loading) {
        return (
            <footer className="bg-white text-black overflow-hidden relative">
                <div className="max-w-7xl mx-auto px-4  py-8 sm:py-12 relative z-10">
                    <div className="animate-pulse">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i}>
                                    <div className="h-5 sm:h-6 bg-gray-200 rounded mb-3 sm:mb-4 w-24 sm:w-32"></div>
                                    <div className="h-3 sm:h-4 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-3 sm:h-4 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        )
    }

    return (
        <footer className="bg-gray-50 text-black overflow-hidden relative">
            {/* Main Footer Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4  py-8 sm:py-12 lg:py-16">
                {/* Top Section - Brand & Contact */}
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mb-8 sm:mb-12 lg:mb-16">
                    {/* Brand Column */}
                    <div className="lg:w-2/5">
                        <div className="flex flex-col sm:flex-row lg:flex-col items-start gap-4 sm:gap-6">
                            <div className="flex-1 ">
                               <div className="flex items-center gap-2 mb-5">
                            <LogoDisplay />
                                 <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-black mb-3 sm:mb-4">
                                    {businessInfo.company?.name || "SZ Naturals"}
                                </h2>
                               </div>
                                
                                <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8">
                                    {businessInfo.company?.description || "Crafting beauty from nature's purest ingredients for your radiant skin."}
                                </p>
                                
                                {/* Contact Info - Stacked on mobile, side by side on larger screens */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                                    <div className="flex items-center gap-3 group cursor-pointer">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-full flex items-center justify-center group-hover:bg-transparent transition-all duration-300 border border-transparent group-hover:border-black group-hover:scale-110 flex-shrink-0">
                                            <FontAwesomeIcon icon={faPhone} className="text-white group-hover:text-black text-sm sm:text-base" />
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs sm:text-sm">Call us</p>
                                            <p className="text-black font-medium text-sm sm:text-base">{businessInfo.contact?.customerSupport?.phone}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 group cursor-pointer">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-full flex items-center justify-center group-hover:bg-transparent transition-all duration-300 border border-transparent group-hover:border-black group-hover:scale-110 flex-shrink-0">
                                            <FontAwesomeIcon icon={faEnvelope} className="text-white group-hover:text-black text-sm sm:text-base" />
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs sm:text-sm">Email us</p>
                                            <p className="text-black font-medium text-sm sm:text-base">{businessInfo.contact?.customerSupport?.email}</p>
                                        </div>
                                    </div>
                                    
                             {businessInfo.location?.displayAddress && (
    <div className="flex items-start gap-3 group cursor-pointer sm:col-span-2 lg:col-span-1">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-full flex items-center justify-center group-hover:bg-transparent transition-all duration-300 border border-transparent group-hover:border-black group-hover:scale-110 flex-shrink-0 mt-1">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-white group-hover:text-black text-sm sm:text-base" />
        </div>
        <div>
            <p className="text-gray-500 text-xs sm:text-sm">Location</p>
            <p className="text-black font-medium text-sm sm:text-base">
                {businessInfo.location?.displayAddress}
            </p>
        </div>
    </div>
)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Links & Newsletter Section */}
                    <div className='lg:w-3/5 flex flex-col justify-center items-center '>
                        {/* Links Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
                            {/* Quick Links */}
                            <div>
                                <h3 className="text-black font-semibold text-lg sm:text-xl mb-4 sm:mb-6 pb-2 border-b border-gray-300">
                                    Quick Links
                                </h3>
                                <ul className="space-y-2 sm:space-y-3">
                                    {['About', 'Shop', 'Blog', 'Contact'].map((item) => (
                                        <li key={item}>
                                            <Link 
                                                to={`/${item.toLowerCase()}`} 
                                                className="text-gray-600 hover:text-black transition-all duration-300 flex items-center gap-2 group hover:translate-x-1 text-sm sm:text-base"
                                            >
                                                {item}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Our Products */}
                            <div>
                                <h3 className="text-black font-semibold text-lg sm:text-xl mb-4 sm:mb-6 pb-2 border-b border-gray-300">
                                    Products
                                </h3>
                                <ul className="space-y-2 sm:space-y-3">
                                    {['Herbal Oils', 'Herbal Shampoo', 'Hair Care'].map((product) => (
                                        <li key={product}>
                                            <a href="#" className="text-gray-600 hover:text-black transition-all duration-300 flex items-center gap-2 group hover:translate-x-1 text-sm sm:text-base">
                                                {product}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Social Media */}
                            <div>
                                <h3 className="text-black font-semibold text-lg sm:text-xl mb-4 sm:mb-6 pb-2 border-b border-gray-300">
                                    Follow Us
                                </h3>
                              <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
    {socialPlatforms.map((platform) => {
        const socialUrl = businessInfo.socialMedia?.[platform.key]
        const isActive = !!socialUrl
        
        return (
            <a
                key={platform.key}
                href={isActive ? socialUrl : "#"}
                target={isActive ? "_blank" : "_self"}
                rel={isActive ? "noopener noreferrer" : ""}
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 border ${
                    isActive 
                        ? `${platform.color} hover:scale-110 border-transparent cursor-pointer` 
                        : "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed opacity-60"
                }`}
                aria-label={platform.label}
                title={isActive ? `Follow us on ${platform.label}` : `${platform.label} coming soon`}
                onClick={!isActive ? (e) => e.preventDefault() : undefined}
            >
                <FontAwesomeIcon 
                    icon={platform.icon} 
                    size="sm" 
                    className={`text-sm sm:text-base ${!isActive ? 'opacity-50' : ''}`}
                />
            </a>
        )
    })}
</div>
                                <p className="text-gray-500 text-xs sm:text-sm">
                                    Stay connected for updates
                                </p>
                            </div>
                        </div>

                        {/* Newsletter Section */}
                        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6">
                                <div >
                                    <h3 className="text-xl sm:text-2xl font-semibold text-black mb-2">
                                        Newsletter
                                    </h3>
                                  
                                </div>
                                <form onSubmit={handleSubscribe} className=" w-full">
                                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Your email address"
                                            className="flex-1 px-4 sm:px-6 py-3 sm:py-4 border border-gray-300 rounded-full text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300 bg-white text-sm sm:text-base w-full"
                                            required
                                        />
                                        <button 
                                            type="submit"
                                            className="px-6 sm:px-8 py-3 sm:py-4 bg-black hover:bg-white text-white hover:text-black font-semibold rounded-full border border-transparent hover:border-black transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto whitespace-nowrap"
                                        >
                                            Subscribe
                                            <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="border-t border-gray-300 pt-6 sm:pt-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
                        <p className="text-gray-500 text-xs sm:text-sm text-center sm:text-left">
                            © {currentYear} {businessInfo.company?.name || "SZ Naturals"}. All rights reserved.
                        </p>
                        <div className="text-gray-500 text-xs sm:text-sm text-center sm:text-right">
                            A Project of{" "}
                            <Link 
                                to='https://jawumitech.com/' 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-black hover:text-gray-700 transition-colors font-medium"
                            >
                                JawumiTech
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer