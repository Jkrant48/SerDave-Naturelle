const ContactForm = () => {
  return (
    <section className="contact-section">
      <div className="contact-inner">
        <h2 className="contact-heading">Contact Us</h2>
        <form className="contact-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="form-input"
              placeholder="Enter your name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="form-input"
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="message" className="form-label">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              className="form-textarea"
              rows="4"
              placeholder="Type your message here"
            />
          </div>

          <button type="submit" className="form-submit">
            Send Message
          </button>
        </form>
      </div>
    </section>
  );
};

export default ContactForm;
