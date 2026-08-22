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
            <p className="eyebrow">Our story</p>
            <h2>Beauty that feels personal</h2>
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
          <p className="eyebrow">Why clients love us</p>
          <h2>Thoughtful care, polished results</h2>
          <div className="value-grid">
            <div>
              <h3>Expert stylists</h3>
              <p>
                Our team brings years of experience and a passion for beautiful
                results.
              </p>
            </div>
            <div>
              <h3>Thoughtful service</h3>
              <p>
                We listen first, then create a styling plan that matches your
                goals.
              </p>
            </div>
            <div>
              <h3>Premium products</h3>
              <p>
                We use trusted formulas that support healthy hair and glowing
                skin.
              </p>
            </div>
          </div>
        </section>

        <section className="team-section">
          <p className="eyebrow">Meet the team</p>
          <h2>Creative experts with a warm touch</h2>
          <div className="team-grid">
            <article className="team-card">
              <img
                src="https://via.placeholder.com/320x320?text=Stylist+1"
                alt="Stylist placeholder"
              />
              <h3>Ava</h3>
              <p>
                Lead stylist specializing in textured hair and creative braids.
              </p>
            </article>
            <article className="team-card">
              <img
                src="https://via.placeholder.com/320x320?text=Stylist+2"
                alt="Stylist placeholder"
              />
              <h3>Maya</h3>
              <p>
                Hair care specialist focused on nourishment treatments and
                shine.
              </p>
            </article>
            <article className="team-card">
              <img
                src="https://via.placeholder.com/320x320?text=Stylist+3"
                alt="Stylist placeholder"
              />
              <h3>Jules</h3>
              <p>
                Service expert who makes every guest feel comfortable and
                confident.
              </p>
            </article>
          </div>
        </section>

        <section className="testimonial-section">
          <div className="testimonial-header">
            <p className="eyebrow">Client love</p>
            <h2>Real reviews from happy guests</h2>
          </div>
          <div className="testimonial-grid">
            <article className="testimonial-item">
              <div className="stars" aria-label="5 out of 5 stars">
                ★★★★★
              </div>
              <p>
                “I left feeling refreshed, confident, and completely cared for.
                The salon atmosphere is calm and the results are beautiful.”
              </p>
              <div className="reviewer">
                <strong>Amara T.</strong>
                <span>Natural hair client</span>
              </div>
            </article>
            <article className="testimonial-item featured-review">
              <div className="stars" aria-label="5 out of 5 stars">
                ★★★★★
              </div>
              <p>
                “The team listened to exactly what I wanted and created a look
                that felt effortless and polished. It was the best salon
                experience I’ve had.”
              </p>
              <div className="reviewer">
                <strong>Nia R.</strong>
                <span>Signature styling client</span>
              </div>
            </article>
            <article className="testimonial-item">
              <div className="stars" aria-label="5 out of 5 stars">
                ★★★★★
              </div>
              <p>
                “From the consultation to the finish, everything felt thoughtful
                and professional. My hair looked healthy and radiant for weeks.”
              </p>
              <div className="reviewer">
                <strong>Leah M.</strong>
                <span>Hair care client</span>
              </div>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default AboutPage;
