import { useContext, useEffect, useState, useMemo, useRef } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import DealItem from "./DealItem";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const RelatedDeals = ({ category, currentDealId }) => {
  const { deals, currency } = useContext(ShopContext);
  const [relatedDeals, setRelatedDeals] = useState([]);
  const sliderRef = useRef(null);

  const filteredDeals = useMemo(() => {
    if (deals && deals.length > 0) {
      return deals
        .filter((deal) => 
          category === deal.category && 
          deal._id !== currentDealId && 
          deal.status === 'published'
        )
        .slice(0, 10);
    }
    return [];
  }, [deals, category, currentDealId]);

  useEffect(() => {
    setRelatedDeals(filteredDeals);
  }, [filteredDeals]);

  // Custom arrow components with FontAwesome icons
  const NextArrow = ({ onClick }) => {
    return (
      <button
        className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
        onClick={onClick}
      >
        <FontAwesomeIcon icon={faChevronRight} className="text-gray-700" />
      </button>
    );
  };

  const PrevArrow = ({ onClick }) => {
    return (
      <button
        className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
        onClick={onClick}
      >
        <FontAwesomeIcon icon={faChevronLeft} className="text-gray-700" />
      </button>
    );
  };

  const sliderSettings = {
    dots: true,
    infinite: relatedDeals.length > 1,
    speed: 500,
    slidesToShow: Math.min(4, relatedDeals.length),
    slidesToScroll: Math.min(2, relatedDeals.length),
    initialSlide: 0,
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: Math.min(3, relatedDeals.length),
          slidesToScroll: Math.min(2, relatedDeals.length),
        }
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(2, relatedDeals.length),
          slidesToScroll: Math.min(1, relatedDeals.length),
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
          dots: true
        }
      }
    ]
  };

  const handleDealClick = (dealId) => {
    // Navigation logic if needed
  };

  return (
    <div className="my-24 relative">
      <div className="py-2 text-center text-3xl mb-5">
        <Title text1={"Related"} text2={"Deals"} />
      </div>

      {relatedDeals.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No related deals available.
        </div>
      ) : (
        <div className="relative px-8 md:px-12 lg:px-16">
          <Slider ref={sliderRef} {...sliderSettings}>
            {relatedDeals.map((deal) => (
              <div key={deal._id} className="px-3 py-4">
                <div className="mx-auto">
                  <DealItem
                    id={deal._id}
                    image={deal.dealImages && deal.dealImages.length > 0 ? deal.dealImages[0] : "/images/fallback-image.jpg"}
                    name={deal.dealName}
                    price={deal.dealTotal || 0}
                    discount={deal.dealFinalPrice || 0}
                    rating={deal.rating || 0}
                    dealType={deal.dealType}
                    productsCount={deal.dealProducts ? deal.dealProducts.length : 0}
                    endDate={deal.dealEndDate}
                    onDealClick={handleDealClick}
                    currency={currency}
                    
                  />
                </div>
              </div>
            ))}
          </Slider>
        </div>
      )}
    </div>
  );
};

export default RelatedDeals;