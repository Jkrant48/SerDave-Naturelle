import { useState } from "react";

const ContactForm = () => {
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          message: formData.get("message"),
        }),
      });
      const result = await response.json();
      setIsError(!response.ok);
      setStatusMessage(result.message || "Could not submit your message.");
    } catch {
      setIsError(true);
      setStatusMessage("Could not reach the contact service.");
    }
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
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
      {statusMessage && (
        <p className="form-note" role={isError ? "alert" : "status"}>
          {statusMessage}
        </p>
      )}
    </form>
  );
};

export default ContactForm;
