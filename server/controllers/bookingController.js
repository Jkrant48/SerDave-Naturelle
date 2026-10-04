// Booking controllers: validate appointment input and use existing PostgreSQL tables.
import pool from "../config/database.js";

export async function createBooking(req, res, next) {
  const {
    customerName,
    customerEmail,
    customerPhone,
    serviceId,
    bookingDate,
    bookingTime,
  } = req.body;

  if (
    ![
      customerName,
      customerEmail,
      customerPhone,
      bookingDate,
      bookingTime,
    ].every((value) => typeof value === "string" && value.trim())
  ) {
    return res
      .status(400)
      .json({ message: "Name, email, phone, date, and time are required." });
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) ||
    !/^\d{2}:\d{2}$/.test(bookingTime) ||
    !Number.isInteger(Number(serviceId)) ||
    Number(serviceId) < 1
  ) {
    return res
      .status(400)
      .json({ message: "Choose a valid service, date, and time." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }

  try {
    const { rows: services } = await pool.query(
      `SELECT services_id, service_name, service_price, deposit_amount
       FROM public.services
       WHERE services_id = $1 AND is_active = TRUE`,
      [Number(serviceId)],
    );

    if (services.length === 0) {
      return res.status(400).json({ message: "Choose an available service." });
    }

    const service = services[0];
    const { rows } = await pool.query(
      `INSERT INTO public.appointments
         (customer_name, customer_email, customer_phone, service_id,
          appointment_datetime, service_price, deposit_amount)
       VALUES ($1, $2, $3, $4, $5::date + $6::time, $7, $8)
       RETURNING appointments_id AS id`,
      [
        customerName.trim(),
        customerEmail.trim(),
        customerPhone.trim(),
        Number(serviceId),
        bookingDate,
        bookingTime,
        service.service_price,
        service.deposit_amount,
      ],
    );
    res.status(201).json({
      message: "Appointment request received.",
      appointment: {
        id: rows[0].id,
        customerName: customerName.trim(),
        service: service.service_name,
        bookingDate,
        bookingTime,
      },
    });
  } catch (error) {
    next(error);
  }
}
