//homepage

import Header from "../components/Header";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import ServiceCard from "../components/ServiceCard";

const HomePage = () => {
  return (
    <>
      <Header />
      <Hero />
      <section id="services" className="services-section">
        <div className="services-inner">
          <h2 className="services-heading">Our Services</h2>
          <div className="services-grid">
            <ServiceCard
              tag="New"
              title="Hair Care"
              description="Hair Styling"
              price="$50"
            />
            <ServiceCard
              tag="Popular"
              title="Facial Treatments"
              description="Rejuvenate your skin with our luxurious facial treatments."
              price="$75"
            />
            <ServiceCard
              tag="Best Seller"
              title="Manicure & Pedicure"
              description="Pamper your hands and feet with our expert manicure and pedicure services."
              price="$40"
            />
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default HomePage;
