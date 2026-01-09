import { assets } from "../assets/assets";
import Title from './Title';

const WhyChooseUs = () => {
  const features = [
    {
      step: "01",
      title: "Pure Ingredients",
      description: "100% natural, chemical-free ingredients sourced from trusted suppliers. We never compromise on quality or purity.",
      additional: "No artificial additives or preservatives"
    },
    {
      step: "02", 
      title: "Handmade with Care",
      description: "Each product is carefully crafted with attention to detail, ensuring consistent quality and effectiveness.",
      additional: "Small batch production for quality control"
    },
    {
      step: "03",
      title: "Eco-Friendly",
      description: "Sustainable packaging and environmentally conscious practices throughout our production process.",
      additional: "Biodegradable and recyclable materials"
    },
    {
      step: "04",
      title: "Ethical Production",
      description: "Fair trade and cruelty-free manufacturing processes that respect both people and the planet.",
      additional: "Supporting local communities"
    },
    {
      step: "05",
      title: "Family Safe",
      description: "Gentle formulas suitable for all ages and skin types, tested for safety and effectiveness.",
      additional: "Dermatologically tested"
    },
    {
      step: "06",
      title: "Local Support",
      description: "Supporting local communities and traditional craftsmanship while delivering exceptional quality.",
      additional: "Promoting traditional herbal knowledge"
    }
  ];

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    const nextSibling = e.target.nextSibling;
    if (nextSibling) {
      nextSibling.style.display = 'block';
    }
  };

  return (
    <section className="bg-gray-50 py-16 md:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Heading and Subtext */}
        <div className="text-center mb-12 md:mb-16 lg:mb-20">
          <div className="mb-6">
            <Title text1={'Why we’re'} text2={'different'} />
          </div>
          <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Discover the difference of truly natural skincare crafted with care, integrity, and a deep respect for nature.
          </p>
        </div>

        {/* Image Left, Features Right Layout with Pinned Right Side */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 xl:gap-16">
          {/* Left Side - Image (50% width) */}
          <div className="lg:w-1/2">
            <div className="sticky top-24">
              <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden shadow-xl">
                <img
                  src={assets.hero_img}
                  className="w-full h-64 md:h-72 lg:h-80 xl:h-96 object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                  decoding="async"
                  onError={handleImageError}
                />
                {/* Fallback placeholder */}
                <div 
                  className="hidden w-full h-64 md:h-72 lg:h-80 xl:h-96 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center"
                >
                  <div className="text-center text-gray-700 p-8">
                    <div className="text-2xl font-bold mb-3">SZ Natural</div>
                    <div className="text-lg">Natural Wellness Products</div>
                    <div className="text-sm text-gray-500 mt-4">Handcrafted with care and integrity</div>
                  </div>
                </div>
              </div>
              
              {/* Image Details */}
              <div className="mt-6 md:mt-8 p-4 md:p-6 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-2">Premium Natural Care</h4>
                <p className="text-gray-600 text-sm">
                  Each SZ naturals product represents our commitment to purity, sustainability, and exceptional quality.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Features List (50% width, Scrolling Content) */}
          <div className="lg:w-1/2">
            <div className="space-y-16 md:space-y-20 lg:space-y-24">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="scroll-mt-24" // For smooth scrolling
                >
                  <div className="space-y-4 md:space-y-6">
                    {/* Step Number */}
                    <div className="inline-block">
                      <div className="text-gray-500 text-sm md:text-base font-semibold tracking-wider">
                        Reason {feature.step}
                      </div>
                    </div>
                    
                    {/* Feature Title */}
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                      {feature.title}
                    </h3>
                    
                    {/* Feature Description */}
                    <p className="text-gray-600 text-base md:text-lg xl:text-xl leading-relaxed">
                      {feature.description}
                    </p>
                    
                    {/* Additional Info */}
                    {feature.additional && (
                      <div className="pt-4 border-t border-gray-100">
                        <p className="text-gray-500 text-sm md:text-base italic">
                          {feature.additional}
                        </p>
                      </div>
                    )}

                    {/* Separator Line (except for last item) */}
                    {index < features.length - 1 && (
                      <div className="pt-8 md:pt-12">
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;