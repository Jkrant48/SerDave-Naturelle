import Header from "../components/Header";
import Footer from "../components/Footer";

const ServicesPage = () => {
  return (
    <>
      <Header />
      <main className="page-shell">
        <section className="page-hero">
          <h1>Our Services</h1>
          <p>
            Explore our signature services for locs, braids, treatments, and
            more.
          </p>
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
