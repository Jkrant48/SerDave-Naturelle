import { useEffect, useState } from "react";
import Hero from "../components/Hero";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { apiUrl } from "../lib/api.js";

const reviewErrorMessage = "Oops, something isn't right. Please try again later.";

const AboutPage = () => {
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewNotice, setReviewNotice] = useState("");
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewIdentity, setReviewIdentity] = useState({ name: "", email: "" });
  const [isAppointmentVerified, setIsAppointmentVerified] = useState(false);
  const [rating, setRating] = useState(null);
  const [reviewText, setReviewText] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl("/api/reviews"), { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Could not load reviews.");
        }
        if (!Array.isArray(result.reviews)) {
          throw new Error("The reviews response was invalid.");
        }
        setReviews(result.reviews);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Could not load reviews:", error);
          setReviewsError(reviewErrorMessage);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingReviews(false);
      });
    return () => controller.abort();
  }, []);

  const verifyAppointment = async (event) => {
    event.preventDefault();
    setIsVerifying(true);
    setReviewError("");
    setReviewNotice("");
    try {
      const response = await fetch(apiUrl("/api/reviews/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewIdentity),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Could not verify your appointment.");
      }
      setIsAppointmentVerified(true);
      setReviewNotice("Appointment verified. You can now leave a review.");
    } catch (error) {
      console.error("Could not verify review appointment:", error);
      setReviewError(reviewErrorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    setIsSubmittingReview(true);
    setReviewError("");
    setReviewNotice("");
    try {
      const response = await fetch(apiUrl("/api/reviews"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reviewIdentity,
          rating,
          message: reviewText,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Could not submit your review.");
      }
      setReviews((currentReviews) => [result.review, ...currentReviews]);
      setReviewIdentity({ name: "", email: "" });
      setIsAppointmentVerified(false);
      setRating(null);
      setReviewText("");
      setIsReviewFormOpen(false);
      setReviewNotice("Thank you! Your review has been published.");
    } catch (error) {
      console.error("Could not submit review:", error);
      setReviewError(reviewErrorMessage);
    } finally {
      setIsSubmittingReview(false);
    }
  };

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
            <a
              className="review-link"
              href="#leave-a-review"
              onClick={() => setIsReviewFormOpen(true)}
            >
              Leave a review
            </a>
          </div>
          {reviewsError && <p role="alert">{reviewsError}</p>}
          {isLoadingReviews && <p role="status">Loading reviews...</p>}
          {!isLoadingReviews && !reviewsError && reviews.length === 0 && (
            <p>There are no reviews yet. Be the first to share your experience.</p>
          )}
          <div className="testimonial-grid">
            {reviews.map((review) => (
              <article className="testimonial-item" key={review.id}>
                <div
                  className="stars"
                  aria-label={`${review.rating} out of 5 stars`}
                >
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </div>
                <p>{review.message}</p>
                <div className="reviewer">
                  <strong>{review.name}</strong>
                  <span>Verified customer</span>
                </div>
              </article>
            ))}
          </div>

          <div id="leave-a-review" className="review-form-area">
            {reviewNotice && <p role="status">{reviewNotice}</p>}
            {reviewError && <p role="alert">{reviewError}</p>}
            {isReviewFormOpen && (
              <section className="review-form-panel" aria-label="Leave a review">
                <h3>Share your experience</h3>
                {!isAppointmentVerified ? (
                  <form className="review-form" onSubmit={verifyAppointment}>
                    <p>First, verify your confirmed appointment with your name and booking email.</p>
                    <label>
                      Name used for the appointment
                      <input
                        required
                        maxLength="255"
                        autoComplete="name"
                        value={reviewIdentity.name}
                        onChange={(event) =>
                          setReviewIdentity({ ...reviewIdentity, name: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Email used for the appointment
                      <input
                        type="email"
                        required
                        maxLength="255"
                        autoComplete="email"
                        value={reviewIdentity.email}
                        onChange={(event) =>
                          setReviewIdentity({ ...reviewIdentity, email: event.target.value })
                        }
                      />
                    </label>
                    <button type="submit" disabled={isVerifying}>
                      {isVerifying ? "Verifying..." : "Verify appointment"}
                    </button>
                  </form>
                ) : (
                  <form className="review-form" onSubmit={submitReview}>
                    <p>Verified appointment for {reviewIdentity.name}.</p>
                    <fieldset className="review-rating">
                      <legend>Your rating</legend>
                      {[5, 4, 3, 2, 1].map((value) => (
                        <label key={value}>
                          <input
                            type="radio"
                            name="rating"
                            value={value}
                            required
                            checked={rating === value}
                            onChange={() => setRating(value)}
                          />
                          <span aria-hidden="true">★</span>
                          <span className="visually-hidden">{value} stars</span>
                        </label>
                      ))}
                    </fieldset>
                    <label>
                      Your review
                      <textarea
                        required
                        maxLength="5000"
                        rows="4"
                        value={reviewText}
                        onChange={(event) => setReviewText(event.target.value)}
                      />
                    </label>
                    <button type="submit" disabled={isSubmittingReview}>
                      {isSubmittingReview ? "Submitting..." : "Submit review"}
                    </button>
                  </form>
                )}
              </section>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default AboutPage;
