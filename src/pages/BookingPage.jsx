import Header from "../components/Header";
import Footer from "../components/Footer";
import BookingForm from "../components/BookingForm";

//enhancements: improve calendar accessibility, add service selection, and implement time slot validation for the booking form.

const BookingPage = () => {
  return (
    <>
      <Header />
      <main className="page-shell">
        <div className="hero-banner">
          <div className="hero-banner-inner">
            <h1 className="B-hero-heading">Book an Appointment</h1>
            <p>
              Choose a date, pick a service, and reserve your preferred time
              with us. <br /> A payment of GHC 50 is required to secure your
              booking.
            </p>
          </div>
        </div>
        <section className="page-hero"></section>
        <BookingForm />
      </main>
      <Footer />
    </>
  );
};

export default BookingPage;
