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
              with us. Add optional services to your booking, then pay the
              non-refundable GH₵50 deposit through Paystack to secure it.
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
