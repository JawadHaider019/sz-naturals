import { useContext, useEffect, useState, useMemo } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";
import { assets } from "../assets/assets";

const RelatedProduct = ({ category }) => {
  const { products } = useContext(ShopContext);
  const [related, setRelated] = useState([]);

  const filteredProducts = useMemo(() => {
    if (products && products.length > 0) {
      return products
        .filter((item) => category === item.category)
        .slice(0, 5);
    }
    return [];
  }, [products, category]);

  useEffect(() => {
    setRelated(filteredProducts);
  }, [filteredProducts]);

  // Calculate grid columns based on number of products - Always 1 column on mobile
  const getGridColumns = () => {
    const count = related.length;
    // Always start with 1 column on mobile, then responsive for larger screens
    if (count === 1) return "grid-cols-1 sm:grid-cols-1 md:grid-cols-1 max-w-md mx-auto";
    if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto";
    if (count === 3) return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-4xl mx-auto";
    if (count === 4) return "grid-cols-1 sm:grid-cols-2 md:grid-cols-4 max-w-6xl mx-auto";
    return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
  };

  return (
    <div className="my-24">
      <div className="py-2 text-center text-3xl mb-5">
        <Title text1={"Related"} text2={"Products"} />
      </div>

      {related.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No related products available.
        </div>
      ) : (
        <div className={`grid ${getGridColumns()} gap-4 gap-y-6 px-4`}>
          {related.map((item) => (
            <ProductItem
              key={item._id}
              id={item._id}
              image={item.image && item.image.length > 0 ? item.image[0] : assets.fallback_image}
              name={item.name}
              price={item.price}
              discount={item.discountprice}
              rating={item.rating || 0}
                  status={item.status}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RelatedProduct;