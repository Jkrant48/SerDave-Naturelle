import Header from "../components/Header";
import Footer from "../components/Footer";
import BookingForm from "../components/BookingForm";

//enhancements: improve calendar accessibility, add service selection, and implement time slot validation for the booking form.

const BookingPage = () => {
  return (
    <>
      <Header />
      <main className="page-shell">
        <section className="page-hero">
          <h1>Book an Appointment</h1>
          <p>
            Choose a date, pick a service, and reserve your preferred time with
            us.
          </p>
        </section>
        <BookingForm />
      </main>
      <Footer />
    </>
  );
};

export default BookingPage;
