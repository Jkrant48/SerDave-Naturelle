//header component
import logoNbg from "../assets/logoNnbg.png";

function Header() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <a href="#home" className="navbar-logo" aria-label="Go to home page">
          <img src={logoNbg} alt="Serdave Naturelle Logo" />
        </a>
        <nav className="navbar-links">
          <a href="#home">Home</a>
          <a href="#about">About Us</a>
          <a href="#services">Services</a>
          <a href="#shop">Shop</a>
          <a href="#work-with-us">Work with Us</a>
        </nav>
      </div>
    </header>
  );
}

export default Header;
