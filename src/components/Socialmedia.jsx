//social pages component

import igScreenshot from "../assets/ig-screenshot.jpg";

const Socialmedia = () => {
  return (
    <section className="socialmedia-section">
      <div className="socialmedia-inner">
        <h2>Follow Us on Social Media</h2>
        <a
          href="https://www.instagram.com/serdave_naturelle?igsh=MWp3MnNvY3UzdzVmeg=="
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={igScreenshot}
            alt="Instagram Screenshot"
            className="socialmedia-screenshot"
          />
        </a>
      </div>
    </section>
  );
};

export default Socialmedia;
