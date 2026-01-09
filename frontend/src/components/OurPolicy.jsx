import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShieldAlt,
  faAward,
  faShippingFast
} from "@fortawesome/free-solid-svg-icons";
import Title from "./Title";

const OurPolicy = () => {
  const policies = [
    {
      icon: faShieldAlt,
      title: "Quality Guaranteed",
      description: "100% authentic, premium quality natural ingredients in all our skincare and beauty products",
      color: "text-black"
    },
    {
      icon: faAward,
      title: "Natural & Safe",
      description: "All products made with pure, certified natural ingredients safe for sensitive skin types",
      color: "text-black"
    },
    {
      icon: faShippingFast,
      title: "Free Delivery",
      description: "Free delivery across Pakistan; minimal charges apply at checkout for order confirmation.",
      color: "text-black"
    }
  ];

  return (
    <div className="py-20 ">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="text-center text-3xl">
            <Title text1={'Our'} text2={'Policies'} />
          </div>
          
          <p className="text-gray-600 font-normal leading-relaxed text-lg max-w-2xl mx-auto mt-4">
            Discover our customer-first policies, designed to ensure your complete satisfaction with Pure Clay's natural and organic products.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {policies.map((policy, index) => (
            <div 
              key={index}
              className="bg-white rounded-3xl border border-black/50 p-8 text-center group transition-all duration-500 hover:-translate-y-2 cursor-pointer shadow-sm hover:shadow-xl border border-gray-100"
            >
              <div className={`w-20 h-20  flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner ${policy.color}`}>
                <FontAwesomeIcon 
                  icon={policy.icon} 
                  className="text-2xl" 
                />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {policy.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed text-sm mb-6">
                {policy.description}
              </p>
              
             
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-black/50 inline-block max-w-2xl hover:shadow-md transition-shadow duration-300">
            <p className="text-gray-700 leading-relaxed italic text-lg">
              "At Pure Clay, we build trust through clear policies and honest practices. Your satisfaction and well-being are our top priority."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OurPolicy;