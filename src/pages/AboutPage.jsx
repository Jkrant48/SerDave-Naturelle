import Header from "../components/Header";
import Footer from "../components/Footer";

const AboutPage = () => {
  return (
    <>
      <Header />
      <main className="page-shell">
        <section className="page-hero">
          <h1>About SerDave Naturelle</h1>
          <p>
            We create a luxury experience through expert care, premium beauty
            services, and thoughtful attention to every detail.
          </p>
        </section>
        <section className="page-card">
          <h2>Our Mission</h2>
          <p>
            Our mission is to help every client feel confident, cared for, and
            beautifully styled.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default AboutPage;
