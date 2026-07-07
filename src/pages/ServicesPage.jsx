import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import haircareImage from "../assets/haircare.jpg";
import salonData from "../json/salon.json";
import ServiceCard from "../components/ServiceCard";

const ServicesPage = () => {
  const categories = salonData.categories || [];
  const services = salonData.services || [];

  return (
    <>
      <Header />
      <main className="page-shell">
        <section className="s-page-hero">
          <div className="hero-banner">
            <div className="hero-banner-inner">
              <h3>Welcome to our digital space!</h3>
              <p>
                Discover the perfect blend of traditional techniques and modern
                innovation.
              </p>
            </div>
          </div>
          <div className="hero-content">
            <div className="hero-content-text">
              <h1>Our Services</h1>
              <Link to="/Booking" className="book-btn">
                Book an Appointment
              </Link>
            </div>
            <img
              src={haircareImage}
              alt="Haircare"
              className="hero-content-image"
            />
          </div>
        </section>
        <section className="page-card">
          <div className="services-grid">
            {categories.map((category) => {
              const categoryServices = services.filter(
                (service) => service.category === category.id,
              );

              return (
                <div key={category.id} className="service-category-group">
                  <h3>{category.name}</h3>
                  {categoryServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default ServicesPage;
