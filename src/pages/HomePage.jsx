//homepage

import Header from "../components/Header";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import Card from "../components/Card";
import Form from "../components/ContactForm";
import MapComponent from "../components/MapComponent";

const HomePage = () => {
  return (
    <>
      <Header />
      <Hero />
      <section id="services" className="services-section">
        <div className="services-inner">
          <h2 className="services-heading">Our Services</h2>
          <div className="services-grid">
            <Card
              tag="New"
              title="Hair Care"
              description="Hair Styling"
              price="$50"
            />
            <Card
              tag="Popular"
              title="Facial Treatments"
              description="Rejuvenate your skin with our luxurious facial treatments."
              price="$75"
            />
            <Card
              tag="Best Seller"
              title="Manicure & Pedicure"
              description="Pamper your hands and feet with our expert manicure and pedicure services."
              price="$40"
            />
          </div>
        </div>
      </section>
      <section className="product-banner">
        <h2 className="product-banner-heading">
          Discover Our Exclusive Products
        </h2>
        <div className="product-banner-content">
          <Card
            title="Hair Care Products"
            description="Explore our range of premium hair care products."
          />
          <Card
            title="Skin Care Products"
            description="Explore our range of premium skin care products."
          />
        </div>
      </section>

      <Form />

      <MapComponent />

      <Footer />
    </>
  );
};

export default HomePage;
