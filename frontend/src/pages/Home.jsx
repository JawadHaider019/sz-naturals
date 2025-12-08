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
        <title>Pure Clay - Pakistan's No. 1 Organic Foods Brand | Natural Products</title>
        <meta 
          name="description" 
          content="Pakistan's leading organic brand - Pure Clay offers premium olive oil, peanuts, dates & natural foods. Trusted quality, 100% pure products across Pakistan." 
        />
        <meta name="keywords" content="Pakistan organic brand, Pakistani olive oil, organic foods Pakistan, natural products Pakistan, No. 1 organic brand, Pakistani dates, local nuts Pakistan" />
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