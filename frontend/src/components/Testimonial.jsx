import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import { FaStar, FaQuoteLeft } from 'react-icons/fa'; 
import { useRef, useState, useEffect } from "react";
import Title from '../components/Title';

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

const Testimonial = () => {
    const sliderRef = useRef(null);
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentSlide, setCurrentSlide] = useState(0);

    // Fetch approved testimonials from backend
    const fetchTestimonials = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/testimonials`);
            if (!response.ok) throw new Error('Failed to fetch testimonials');
            const data = await response.json();
            
            // Filter only approved testimonials
            const approvedTestimonials = data.filter(testimonial => testimonial.status === 'approved');
            setTestimonials(approvedTestimonials);
        } catch (error) {
            setError('Failed to load testimonials');
        } finally {
            setLoading(false);
        }
    };

    // Load testimonials on component mount
    useEffect(() => {
        fetchTestimonials();
    }, []);

    const sliderSettings = {
        dots: true,
        infinite: testimonials.length > 1,
        speed: 600,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: testimonials.length > 1,
        autoplaySpeed: 5000,
        arrows: false,
        beforeChange: (current, next) => setCurrentSlide(next),
        customPaging: (i) => (
            <div className={`w-8 h-1 rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-black w-10' : 'bg-gray-300'}`}></div>
        ),
        dotsClass: "slick-dots flex justify-center gap-2 mt-8",
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


    if (loading) {
        return (
            <div className="py-16 md:py-24 px-4">
                <div className="text-center mb-12">
                    <Title text1={'Customer'} text2={'Testimonials'} />
                </div>
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-16 md:py-24 px-4">
                <div className="text-center mb-12">
                    <Title text1={'Customer'} text2={'Reviews'} />
                </div>
                <div className="text-center py-12">
                    <p className="text-red-600 mb-4">Error: {error}</p>
                    <button 
                        onClick={fetchTestimonials}
                        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition duration-300 font-medium"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (testimonials.length === 0) {
        return (
            <div className="py-16 md:py-24 px-4">
                <div className="text-center mb-12">
                    <Title text1={'Customer'} text2={'Reviews'} />
                </div>
                <div className="text-center py-12">
                    <div className="inline-block p-8 bg-gray-50 rounded-2xl">
                        <p className="text-gray-600 text-lg mb-2">No Reviews yet</p>
                        <p className="text-gray-500">Be the first to share your experience!</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-16 md:py-24 px-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gray-100 rounded-full -translate-x-16 -translate-y-16 opacity-50"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-gray-100 rounded-full translate-x-20 translate-y-20 opacity-50"></div>

            <div className="relative z-10 max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <Title text1={'Customer'} text2={'Reviews'} />
                    <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
                        Hear what our customers have to say about their experience with SZ Naturals
                    </p>
                </div>

                <div className="relative">
                    {/* Navigation Buttons - Modern Design */}
                    {testimonials.length > 1 && (
                        <>
                            <button 
                                className="absolute -left-4 md:-left-12 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-3 shadow-lg border border-gray-200 transition duration-300 hover:bg-black hover:text-white hover:scale-110"
                                onClick={() => sliderRef.current.slickPrev()}
                                aria-label="Previous testimonial"
                            >
                                <IoIosArrowBack size={24} />
                            </button>

                            <button 
                                className="absolute -right-4 md:-right-12 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-3 shadow-lg border border-gray-200 transition duration-300 hover:bg-black hover:text-white hover:scale-110"
                                onClick={() => sliderRef.current.slickNext()}
                                aria-label="Next testimonial"
                            >
                                <IoIosArrowForward size={24} />
                            </button>
                        </>
                    )}

                    <Slider ref={sliderRef} {...sliderSettings}>
                        {testimonials.map((testimonial, index) => (
                            <div key={testimonial._id || index} className="px-4">
                                <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 relative overflow-hidden">
                                   
                                    {/* Rating stars */}
                                    <div className="flex justify-center mb-6">
                                        {[...Array(5)].map((_, i) => (
                                            <FaStar 
                                                key={i} 
                                                className={`w-6 h-6 md:w-7 md:h-7 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-200'}`} 
                                            />
                                        ))}
                                    </div>
                                    
                                    {/* Testimonial content */}
                                    <p className="text-lg md:text-xl text-gray-700 italic mb-8 leading-relaxed text-center max-w-3xl mx-auto">
                                        "{testimonial.content}"
                                    </p>
                                    
                                    {/* Customer info */}
                                    <div className="flex flex-col items-center mt-8 pt-8 border-t border-gray-100">
                                        <div className="flex items-center gap-4">
                                            {/* Customer avatar/initials */}
                                           
                                            <div className="text-left">
                                                <h4 className="font-semibold text-gray-900 text-lg">{testimonial.name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-gray-500 text-sm">
                                                        via {getPlatformLabel(testimonial.platform)}
                                                    </span>
                                                   
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Slider>

                   
                </div>

            </div>
        </div>
    );
}

export default Testimonial;