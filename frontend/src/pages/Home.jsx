import { Helmet } from 'react-helmet-async'
import BestSeller from "../components/BestSeller"
import Hero from "../components/Hero"
import LatestCollection from "../components/LatestCollection"
import Testimonial from '../components/Testimonial'
import WhyChooseUs from "../components/WhyChooseUs"
import DealCollection from "../components/DealCollection"

const Home = () => {
  return (
    <div>

      <Helmet>
  <title>SZ Naturals - Where Ancient Herbal Wisdom meets Modern Hair Excellence</title>
  <meta 
    name="description" 
    content="SZ Naturals - Where Ancient Herbal Wisdom meets Modern Hair Excellence. Pure, handmade natural hair care products crafted with organic ingredients like Amla, Shikakai, Bhringraj, and Neem for complete hair wellness." 
  />
  <meta name="keywords" content="natural hair care, herbal hair products, organic hair care, Amla hair oil, Shikakai shampoo, Bhringraj hair treatment, neem hair care, handmade hair products, Pakistan natural products" />
</Helmet>
      <Hero/>
      <DealCollection />
      <LatestCollection/>
      <BestSeller/>
      <WhyChooseUs/>
      <Testimonial/>
   
    </div>
  )
}

export default Home