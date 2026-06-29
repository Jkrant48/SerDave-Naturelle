//homepage
import { Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import Card from "../components/Card";
import ProductCard from "../components/ProductCard";
import Form from "../components/ContactForm";
import Socialmedia from "../components/Socialmedia";
import MapComponent from "../components/MapComponent";
import heroimg from "../assets/hero.png";
import serviceicon from "../assets/services-icon.png";
import hairdresser from "../assets/hairdresser.jpg";
import locsImage from "../assets/locs.jpg";
import braidsImage from "../assets/braids.jpg";
import haircareImage from "../assets/haircare.jpg";

const HomePage = () => {
  return (
    <>
      <div className="container">
        <div className="img-container">
          <img src={heroimg} alt="Hero-picbyfreepik" />
        </div>
        <Header />
        <Hero />
      </div>
      <section id="services" className="services-section">
        <div className="services-inner">
          <div className="services-heading">
            <img src={serviceicon} alt="service-icon" />
            <h2>Our Services</h2>
          </div>
          <div className="services-grid">
            <Card
              tag="New"
              title="Locs"
              description="Fresh locs, retwist, and maintenance services to keep your hair looking its best."
              price="GHC 150"
              image={locsImage}
            />
            <Card
              tag="Popular"
              title="Braids"
              description="Stylish and trendy braiding services for all occasions."
              price="GHC 75"
              image={braidsImage}
            />
            <Card
              tag="Best Seller"
              title="Hair treatments"
              description="Pamper your hair with our expert hair treatment services."
              price="GHC 40"
              image={haircareImage}
            />
          </div>
          <Link to="/services" className="services-btn">
            Explore All Services
          </Link>
        </div>
      </section>
      <section className="product-banner">
        <div className="product-banner-inner">
          <h2 className="product-banner-heading">
            Discover Our Exclusive Products
          </h2>
          <div className="product-banner-content">
            <ProductCard
              title="Hair Care Products"
              description="Explore our range of premium hair care products."
              image={locsImage}
              imageAlt="Hair care products"
            />
            <ProductCard
              title="Skin Care Products"
              description="Explore our range of premium skin care products."
              image={locsImage}
              imageAlt="Skin care products"
            />
          </div>
        </div>
      </section>
      <section className="workwithus-section">
        <div className="workwithus-inner">
          <div className="info">
            <h2 className="workwithus-heading">Work With Us</h2>
            <p className="workwithus-description">
              Join our team of passionate professionals and be part of a
              thriving beauty industry. We are always looking for talented
              individuals to join our team. If you have a passion for beauty and
              want to work in a dynamic environment, we would love to hear from
              you.
            </p>
            <a href="#" className="workwithus-button">
              Apply Now
            </a>
          </div>
          <img src={hairdresser} alt="Hairdresserfreepik" />
        </div>
      </section>

      <Form />
      <Socialmedia />
      <MapComponent />
      <Footer />
    </>
  );
};

export default HomePage;
