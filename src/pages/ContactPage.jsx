import Header from "../components/Header";
import Footer from "../components/Footer";
import Form from "../components/ContactForm";

const ContactPage = () => {
  return (
    <>
      <Header />
      <main className="page-shell">
        <section className="page-hero">
          <h1>Contact Us</h1>
          <p>
            Reach out to book an appointment or ask about our services and
            products.
          </p>
        </section>
        <Form />
      </main>
      <Footer />
    </>
  );
};

export default ContactPage;
