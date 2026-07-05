import Hero from "../components/Hero";
import Header from "../components/Header";
import Footer from "../components/Footer";

const AboutPage = () => {
  return (
    <>
      <Header />
      <Hero />
      <main className="page-shell">
        <section className="about-grid">
          <article className="about-card">
            <h2>Our Story</h2>
            <p>
              SerDave Naturelle was founded to deliver a calm, confident, and
              beautiful salon experience. Every visit is tailored around your
              needs with the finest products and expert styling.
            </p>
            <ul>
              <li>Premium care for natural hair and textured styles</li>
              <li>Relaxing salon atmosphere with warm customer service</li>
              <li>Personalized beauty plans for every guest</li>
            </ul>
          </article>
          <article className="about-card about-card-image">
            <img
              src="https://via.placeholder.com/600x500?text=Meet+Our+Founder"
              alt="Founder placeholder"
            />
          </article>
        </section>

        <section className="about-values">
          <h2>Why clients love us</h2>
          <div className="value-grid">
            <div>
              <h3>Expert stylists</h3>
              <p>Our team brings years of experience and a passion for beautiful results.</p>
            </div>
            <div>
              <h3>Thoughtful service</h3>
              <p>We listen first, then create a styling plan that matches your goals.</p>
            </div>
            <div>
              <h3>Premium products</h3>
              <p>We use trusted formulas that support healthy hair and glowing skin.</p>
            </div>
          </div>
        </section>

        <section className="team-section">
          <h2>Meet the team</h2>
          <div className="team-grid">
            <article className="team-card">
              <img
                src="https://via.placeholder.com/320x320?text=Stylist+1"
                alt="Stylist placeholder"
              />
              <h3>Ava</h3>
              <p>Lead stylist specializing in textured hair and creative braids.</p>
            </article>
            <article className="team-card">
              <img
                src="https://via.placeholder.com/320x320?text=Stylist+2"
                alt="Stylist placeholder"
              />
              <h3>Maya</h3>
              <p>Hair care specialist focused on nourishment treatments and shine.</p>
            </article>
            <article className="team-card">
              <img
                src="https://via.placeholder.com/320x320?text=Stylist+3"
                alt="Stylist placeholder"
              />
              <h3>Jules</h3>
              <p>Service expert who makes every guest feel comfortable and confident.</p>
            </article>
          </div>
        </section>

        <section className="testimonial-card">
          <h2>Client confidence starts here</h2>
          <blockquote>
            “The team at SerDave Naturelle made my first visit easy, relaxing, and
            unforgettable. I left with a fresh style and renewed confidence.”
          </blockquote>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default AboutPage;
