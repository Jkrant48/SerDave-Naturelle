// Contact controllers: validate incoming contact data and store messages.
import pool from "../config/database.js";

export async function createContactMessage(req, res, next) {
  const { name, email, message } = req.body;

  if (
    ![name, email, message].every(
      (value) => typeof value === "string" && value.trim(),
    )
  ) {
    return res
      .status(400)
      .json({ message: "Name, email, and message are required." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO public.messages (customer_name, customer_email, message_text)
       VALUES ($1, $2, $3)
       RETURNING message_id AS id`,
      [name.trim(), email.trim(), message.trim()],
    );

    res.status(201).json({
      message: "Your message has been received.",
      id: rows[0].id,
    });
  } catch (error) {
    next(error);
  }
}
