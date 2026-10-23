import pool from "../config/database.js";

function readReviewIdentity(body) {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!name || name.length > 255) {
    return { error: "Enter the name used for your appointment (255 characters max)." };
  }
  if (
    email.length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return { error: "Enter the email address used for your appointment." };
  }
  return { name, email };
}

export async function getPublicReviews(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT reviews_id AS id, review_rating AS rating,
              review_text AS message, review_author AS name,
              created_at AS "createdAt"
       FROM public.reviews
       WHERE is_approved = TRUE
       ORDER BY created_at DESC`,
    );
    return res.json({ reviews: rows });
  } catch (error) {
    return next(error);
  }
}

export async function verifyReviewAppointment(req, res, next) {
  const identity = readReviewIdentity(req.body);
  if (identity.error) {
    return res.status(400).json({ message: identity.error });
  }

  try {
    const { rows } = await pool.query(
      `SELECT EXISTS (
         SELECT 1
         FROM public.appointments
         WHERE lower(trim(customer_name)) = lower($1)
           AND lower(trim(customer_email)) = $2
           AND appointment_status IN ('confirmed', 'completed')
       ) AS verified`,
      [identity.name, identity.email],
    );
    if (!rows[0].verified) {
      return res.status(404).json({
        message: "We could not verify a confirmed appointment with those details.",
      });
    }
    return res.json({ verified: true });
  } catch (error) {
    return next(error);
  }
}

export async function createReview(req, res, next) {
  const identity = readReviewIdentity(req.body);
  if (identity.error) {
    return res.status(400).json({ message: identity.error });
  }

  const rating = Number(req.body?.rating);
  const reviewText =
    typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Choose a rating from 1 to 5 stars." });
  }
  if (!reviewText || reviewText.length > 5000) {
    return res.status(400).json({
      message: "Write a review (5000 characters max).",
    });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO public.reviews
         (review_rating, review_text, review_author, is_approved)
       SELECT $3, $4, $1::text, TRUE
       WHERE EXISTS (
         SELECT 1
         FROM public.appointments
         WHERE lower(trim(customer_name)) = lower($1::text)
           AND lower(trim(customer_email)) = $2::text
           AND appointment_status IN ('confirmed', 'completed')
       )
       RETURNING reviews_id AS id, review_rating AS rating,
                 review_text AS message, review_author AS name,
                 created_at AS "createdAt"`,
      [identity.name, identity.email, rating, reviewText],
    );
    if (!rows.length) {
      return res.status(404).json({
        message: "We could not verify a confirmed appointment with those details.",
      });
    }
    return res.status(201).json({ review: rows[0] });
  } catch (error) {
    return next(error);
  }
}
