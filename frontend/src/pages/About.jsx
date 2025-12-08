import { useMemo, useCallback, useState, useEffect } from 'react';
import Title from '../components/Title';
import { assets } from '../assets/assets';
import { 
  FaShieldAlt, 
  FaRecycle, 
  FaEye, 
  FaQuoteLeft, 
  FaLeaf,
  FaHeart,
  FaAward,
  FaHandHoldingHeart,
  FaStar,
  FaCrown,
  FaUsers
} from 'react-icons/fa';
import { GiHerbsBundle } from 'react-icons/gi';
import { MdNaturePeople } from 'react-icons/md';
import Testimonial from '../components/Testimonial';

const About = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  
  const fetchTeamMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
     
      const response = await fetch(`${backendUrl}/api/teams`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch team members: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const activeMembers = data.data
          .filter(member => member.isActive !== false)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        
        setTeamMembers(activeMembers);
      } else {
        throw new Error(data.message || 'Failed to fetch team members');
      }
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError(err.message);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  // Memoized promise cards data - Black & White Theme
  const promiseCards = useMemo(() => [
    { 
      icon: GiHerbsBundle, 
      title: "Herbal Purity", 
      desc: "100% natural herbs. No preservatives, artificial flavors, or chemical additives.", 
      borderColor: "border-gray-900"
    },
    { 
      icon: FaCrown, 
      title: "Ancient Wisdom", 
      desc: "Formulated with time-tested herbs like Amla, Shikakai, Bhringraj, and Neem.", 
      borderColor: "border-gray-900"
    },
    { 
      icon: FaRecycle, 
      title: "Sustainable Ethos", 
      desc: "Eco-conscious packaging with responsibly sourced herbal ingredients.", 
      borderColor: "border-gray-900"
    },
    { 
      icon: FaEye, 
      title: "Complete Transparency", 
      desc: "Every ingredient disclosed. Know exactly what nurtures your hair.", 
      borderColor: "border-gray-900"
    },
    { 
      icon: FaHeart, 
      title: "Crafted with Care", 
      desc: "Each product blended with intention for your hair's holistic health.", 
      borderColor: "border-gray-900"
    },
    { 
      icon: FaAward, 
      title: "Uncompromised Quality", 
      desc: "Premium herbal extracts in every formulation we create.", 
      borderColor: "border-gray-900"
    }
  ], []);



// Hero Section - Monochromatic
const HeroSection = useMemo(() => (
  <section className="relative min-h-[90vh] flex items-center justify-center">
    {/* Background with overlay for better text contrast */}
    <div className="absolute inset-0 z-0">
      <div className="absolute inset-0" style={{
        backgroundImage: `url("${assets.about_img}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}></div>
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/70"></div>
     </div>
    
    {/* Content */}
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <div className="mb-12">
     
        
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold uppercase text-white mb-6 tracking-tighter">
          SZ <span className="text-gray-300">Naturals</span>
        </h1>
        
        <div className="w-32 h-1 bg-white/50 mx-auto mb-8"></div>
        
        <p className="text-xl md:text-2xl lg:text-3xl text-white/70 font-light max-w-4xl mx-auto leading-relaxed tracking-wide">
          Where <span className="font-medium text-white">Ancient Herbal Wisdom</span> meets <span className="font-medium text-white">Modern Hair Excellence</span>
        </p>
      </div>
      
    
    </div>
  </section>
), []);

  // Philosophy Section
  const PhilosophySection = () => (
    <section className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left Column - Image */}
          <div className="order-2 lg:order-1">
            <div className="relative group">
              {/* Main Image Container */}
              <div className="relative overflow-hidden rounded-lg shadow-2xl">
                <img
                  src={assets.about_img3}
                  alt="Herbal Ingredients - SZ Naturals"
                  className="w-full h-[500px] object-cover transform group-hover:scale-105 transition-transform duration-1000"
                  loading="lazy"
                  decoding="async"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              </div>
              
              {/* Floating Label */}
              <div className="absolute -bottom-6 -right-6 bg-black text-white px-6 py-3 rounded-lg shadow-xl">
                <div className="text-sm tracking-widest uppercase flex items-center gap-2">
                  <GiHerbsBundle /> Herbal Heritage
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="order-1 lg:order-2">
            <div className="my-10">
              
              
              {/* Main Heading */}
              <h2 className="text-4xl uppercase md:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight">
                Roots in <span className="text-gray-600">Nature</span>,<br />
                Vision in <span className="text-gray-600">Innovation</span>
              </h2>
              
              {/* Content */}
              <div className="space-y-6">
                <p className="text-gray-600 text-lg leading-relaxed">
                  We believe true hair vitality is nurtured by nature's purest herbs — Amla for strength, Shikakai for cleansing, Bhringraj for growth, and Neem for purity. Each ingredient is chosen for its time-tested benefits.
                </p>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Our formulations honor ancient Ayurvedic wisdom while embracing modern science, creating hair care that truly works from root to tip.
                </p>
              </div>
              
              {/* Quote Box */}
              <div className="mt-12 p-8 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-start gap-4">
             
                  <div>
                    <p className="text-gray-700 text-lg italic leading-relaxed">
                      "Nature doesn't rush, yet everything is accomplished. Our hair care follows this wisdom — pure, patient, and profoundly effective."
                    </p>
                    <div className="mt-4 text-gray-500 text-sm uppercase tracking-wider flex items-center gap-2">
                      <FaLeaf /> SZ Naturals Founder
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );


  // Mission & Vision Section
  const MissionSection = () => (
    <section className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
             <div className="mb-6">
          <Title text1={'Why We'} text2={'Exist'} />
        </div>
          <p className="text-gray-600 text-xl max-w-3xl mx-auto">
            Our commitment to bridging ancient herbal wisdom with modern hair care needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
          {/* Mission Card */}
          <div className="group relative">
            {/* Background Effect */}
            <div className="absolute inset-0 bg-gray-50 rounded-2xl transform group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-300"></div>
            
            {/* Main Card */}
            <div className="relative bg-white p-10 rounded-2xl border-2 border-gray-900 shadow-lg hover:shadow-2xl transition-all duration-300">
              {/* Icon */}
              <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-8 transform group-hover:scale-110 transition-transform duration-300">
                <FaHandHoldingHeart className="text-white text-3xl" />
              </div>
              
              {/* Content */}
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                To create transformative herbal hair care that nourishes deeply, respects our planet, and reconnects you with nature's healing power — one strand at a time.
              </p>
              
              {/* Decorative Line */}
              <div className="mt-8 w-16 h-1 bg-gray-900"></div>
            </div>
          </div>

          {/* Vision Card */}
          <div className="group relative">
            {/* Background Effect */}
            <div className="absolute inset-0 bg-gray-50 rounded-2xl transform group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-300"></div>
            
            {/* Main Card */}
            <div className="relative bg-white p-10 rounded-2xl border-2 border-gray-900 shadow-lg hover:shadow-2xl transition-all duration-300">
              {/* Icon */}
              <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-8 transform group-hover:scale-110 transition-transform duration-300">
                <FaEye className="text-white text-3xl" />
              </div>
              
              {/* Content */}
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                To inspire a global return to herbal hair care traditions, becoming the trusted authority in natural hair wellness and setting new standards for purity and efficacy.
              </p>
              
              {/* Decorative Line */}
              <div className="mt-8 w-16 h-1 bg-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // Promise Section
  const PromiseSection = () => (
    <section className="py-24 md:py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
             <div className="mb-6">
          <Title text1={' The SZ'} text2={'Promise'} />
        </div>
       
         
          <p className="text-gray-600 text-xl max-w-2xl mx-auto">
            Six pillars that define every product we create
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {promiseCards.map((item, index) => (
            <div 
              key={index}
              className="group relative"
            >
              {/* Hover Background */}
              <div className="absolute inset-0 bg-white rounded-2xl transform group-hover:scale-105 transition-transform duration-300"></div>
              
              {/* Main Card */}
              <div className={`relative bg-gray-50 p-8 rounded-2xl border-2 ${item.borderColor} transition-all duration-300 group-hover:-translate-y-2`}>
                {/* Icon */}
                <div className="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center mb-6 transform group-hover:rotate-12 transition-transform duration-500">
                  <item.icon className="text-white text-2xl" />
                </div>
                
                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.desc}
                </p>
                
                {/* Hover Indicator */}
                <div className="mt-6 w-8 h-1 bg-gray-900 transform group-hover:w-full transition-all duration-300"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  // Team Section
  const TeamSection = () => {
    const handleImageError = useCallback((e) => {
      e.target.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
    }, []);

    return (
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
          
                  <div className="mb-6">
          <Title text1={'Our'} text2={'experts'} />
        </div>
       
            
            <p className="text-gray-600 text-xl max-w-2xl mx-auto">
              The passionate custodians of herbal wisdom and modern innovation
            </p>
          </div>

          {error && (
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-8 py-4 bg-red-50 border border-red-200 rounded-xl">
                <span className="text-red-600">Unable to load team members: {error}</span>
              </div>
            </div>
          )}

          {/* Team Members List - Alternating Layout */}
          <div className="space-y-24 md:space-y-32">
            {loading ? (
              // Loading Skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className={`grid md:grid-cols-2 gap-12 lg:gap-16 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                  <div className="animate-pulse">
                    <div className="h-[400px] w-full bg-gray-200 rounded-2xl"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-gray-300 text-8xl mb-6">👥</div>
                <h3 className="text-3xl font-semibold text-gray-400 mb-4">Our Team</h3>
                <p className="text-gray-500 max-w-md mx-auto text-lg">
                  Meet the team behind SZ Naturals — profiles coming soon.
                </p>
              </div>
            ) : (
              teamMembers.map((member, index) => (
                <div 
                  key={member._id} 
                  className={`grid md:grid-cols-2 gap-12 lg:gap-16 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
                >
          
                  {/* Image - Alternates sides */}
                  <div className={`relative group ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                    {/* Main Image Container */}
                    <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                      <img
                        className="w-full h-auto object-cover transform group-hover:scale-110 transition-transform duration-700"
                        src={member.image?.url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'}
                        alt={`${member.name} - ${member.role}`}
                        loading="lazy"
                        decoding="async"
                        onError={handleImageError}
                      />
                      {/* Overlay Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                    
                  
                  </div>

                  {/* Content - Alternates sides */}
                  <div className={`${index % 2 === 1 ? 'md:order-1' : ''}`}>
                    {/* Name and Role */}
                    <div className="mb-6">
                      <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-8 h-px bg-gray-900"></div>
                        <span className="text-gray-900 font-medium text-sm uppercase tracking-widest">
                          {member.role || 'Team Member'}
                        </span>
                      </div>
                      
                      <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                        {member.name}
                      </h3>
                      
                      {/* Title/Role Badge */}
                      {member.title && (
                        <div className="inline-block px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg mb-6">
                          {member.title}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {member.description && (
                      <div className="space-y-4">
                        <p className="text-gray-600 text-lg leading-relaxed">
                          {member.description}
                        </p>
                      </div>
                    )}

                    {/* Expertise Tags */}
                    {member.expertise && Array.isArray(member.expertise) && (
                      <div className="mt-8 flex flex-wrap gap-2">
                        {member.expertise.slice(0, 3).map((skill, idx) => (
                          <span 
                            key={idx}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full border border-gray-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quote if available */}
                    {member.quote && (
                      <div className="mt-8 p-6 bg-gray-50 rounded-xl border-l-4 border-gray-900">
                        <FaQuoteLeft className="text-gray-400 text-xl mb-3" />
                        <p className="text-gray-700 italic">
                          "{member.quote}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    );
  };

  // Closing Section
  const ClosingSection = () => (
    <section className="py-24 md:py-32 bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Decorative Top Line */}
        
        {/* Main Heading */}
        <h2 className="text-5xl uppercase md:text-6xl font-bold text-black mb-8">
          Thank You for <span className="text-gray-900">Choosing</span> SZ Naturals
        </h2>

        
        {/* Content */}
        <div className="space-y-8">
          <p className="text-gray-600 text-xl leading-relaxed max-w-3xl mx-auto">
            We're honored to be part of your hair wellness journey. Every bottle represents our unwavering commitment to herbal purity, sustainable practices, and transformative results.
          </p>
          
          <p className="text-gray-500 text-lg">
            Your trust inspires us to continue honoring nature's wisdom in every formulation.
          </p>
        </div>
        
        {/* Signature Section */}
        <div className="mt-16 pt-12 border-t border-gray-700">
          <div className="text-gray-900 text-sm uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
            <FaHeart className="text-red-600" /> With gratitude
          </div>
          
          {/* Signature Line */}
          <div className="relative inline-block">
            <div className="text-black font-bold text-2xl tracking-wider">
              The SZ Naturals Team
            </div>
              </div>
          
        </div>
      </div>
    </section>
  );

  return (
    <div>
      {HeroSection}
      <PhilosophySection />
      <MissionSection />
      <PromiseSection />
      <TeamSection />
      <ClosingSection />
      <Testimonial />
    </div>
  );
};

export default About;