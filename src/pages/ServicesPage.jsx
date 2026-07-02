import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import haircareImage from "../assets/haircare.jpg";

const ServicesPage = () => {
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
          <h2>Featured Services</h2>
          <ul>
            <li>Loc maintenance and retwists</li>
            <li>Stylish braids for every occasion</li>
            <li>Hair treatment and nourishment</li>
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default ServicesPage;
