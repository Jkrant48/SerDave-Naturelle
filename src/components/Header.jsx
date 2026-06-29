//header component
import { Link } from "react-router-dom";
import logoNbg from "../assets/logoNnbg.png";

function Header() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo" aria-label="Go to home page">
          <img src={logoNbg} alt="Serdave Naturelle Logo" />
        </Link>
        <nav className="navbar-links">
          <Link to="/">Home</Link>
          <Link to="/about">About Us</Link>
          <Link to="/services">Services</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
