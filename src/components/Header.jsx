//header component
import { useState } from "react";
import { Link } from "react-router-dom";
import logoNbg from "../assets/logoNnbg.png";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo" aria-label="Go to home page">
          <img src={logoNbg} alt="Serdave Naturelle Logo" />
        </Link>

        <button
          className="hamburger"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        <nav className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          <Link to="/about" onClick={() => setMenuOpen(false)}>
            About Us
          </Link>
          <Link to="/services" onClick={() => setMenuOpen(false)}>
            Services
          </Link>
          <Link to="/booking" onClick={() => setMenuOpen(false)}>
            Booking
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
