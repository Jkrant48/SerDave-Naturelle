//hero component (small changes needed)
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section id="home" className="hero">
      <div className="hero-overlay">
        <div className="hero-inner">
          <h1 className="hero-title">Welcome to SerDave Naturelle</h1>
          <p className="hero-subtitle">
            Experience luxury services and top‑notch products.
          </p>
          <Link to="/booking" className="hero-btn">
            Book Now
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
