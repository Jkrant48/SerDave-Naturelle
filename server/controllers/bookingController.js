// Booking controllers validate appointment input and verify Paystack payments.
import { randomUUID } from "node:crypto";
import process from "node:process";
import pool from "../config/database.js";

const DEPOSIT_CENTS = 5000;

async function initializePaystackPayment({ customerEmail, appointmentId, reference }) {
  const callbackUrl = new URL(
    "/booking",
    process.env.CLIENT_URL || "http://localhost:5173",
  ).toString();
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: customerEmail,
      amount: DEPOSIT_CENTS,
      currency: "GHS",
      reference,
      callback_url: callbackUrl,
      metadata: { appointment_id: String(appointmentId) },
    }),
  });
  const result = await response.json();

  if (!response.ok || !result.status || !result.data?.authorization_url) {
    const error = new Error("Paystack rejected the transaction initialization.");
    error.paystackMessage =
      typeof result.message === "string" ? result.message : null;
    error.paystackStatus = response.status;
    throw error;
  }

  return result.data.authorization_url;
}

export async function createBooking(req, res, next) {
  const {
    customerName,
    customerEmail,
    customerPhone,
    serviceId,
    addOnServiceIds = [],
    bookingDate,
    bookingTime,
  } = req.body;

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return res.status(503).json({
      message: "Online payments are not configured. Please contact the salon.",
    });
  }

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
    Number(serviceId) < 1 ||
    !Array.isArray(addOnServiceIds) ||
    addOnServiceIds.length > 10 ||
    addOnServiceIds.some(
      (id) => !Number.isInteger(Number(id)) || Number(id) < 1,
    )
  ) {
    return res
      .status(400)
      .json({ message: "Choose a valid service, date, and time." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }

  const mainId = Number(serviceId);
  const addOnIds = addOnServiceIds.map(Number);
  if (new Set(addOnIds).size !== addOnIds.length || addOnIds.includes(mainId)) {
    return res.status(400).json({ message: "Choose each add-on only once." });
  }

  const getMainServiceType = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (/\btreatment(s)?\b/.test(name)) return "treatment";
    if (/\bbraid(s)?\b/.test(name)) return "braids";
    if (/\bloc(s)?\b/.test(name)) return "locs";
    return null;
  };

  try {
    const requestedIds = [mainId, ...addOnIds];
    const { rows: services } = await pool.query(
      `SELECT s.services_id, s.service_name, s.service_price,
              c.category_name
       FROM public.services AS s
       JOIN public.category AS c ON c.category_id = s.category_id
       WHERE s.services_id = ANY($1::int[]) AND s.is_active = TRUE`,
      [requestedIds],
    );

    if (services.length !== requestedIds.length) {
      return res.status(400).json({
        message: "Choose an available main service and available add-ons.",
      });
    }

    const serviceById = new Map(
      services.map((service) => [Number(service.services_id), service]),
    );
    const service = serviceById.get(mainId);
    if (!service || !getMainServiceType(service.category_name)) {
      return res.status(400).json({
        message: "Choose a main service in Treatment, Braids, or Locs.",
      });
    }

    const addOnServices = addOnIds.map((id) => serviceById.get(id));
    if (addOnServices.some((addOn) => getMainServiceType(addOn.category_name))) {
      return res.status(400).json({
        message: "Only services outside Treatment, Braids, and Locs can be added as add-ons.",
      });
    }

    const totalCents = [service, ...addOnServices].reduce(
      (sum, item) => sum + Math.round(Number(item.service_price) * 100),
      0,
    );
    if (totalCents < DEPOSIT_CENTS) {
      return res.status(400).json({
        message: "The selected services must total at least GH₵50 to book.",
      });
    }

    const reference = `SDN_${randomUUID().replaceAll("-", "")}`;
    const client = await pool.connect();
    let appointmentId;
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `INSERT INTO public.appointments
           (customer_name, customer_email, customer_phone, service_id,
            appointment_datetime, service_price, deposit_amount)
         VALUES ($1, $2, $3, $4, $5::date + $6::time, $7, $8)
         RETURNING appointments_id AS id`,
        [
          customerName.trim(),
          customerEmail.trim(),
          customerPhone.trim(),
          mainId,
          bookingDate,
          bookingTime,
          totalCents / 100,
          DEPOSIT_CENTS / 100,
        ],
      );
      appointmentId = rows[0].id;

      if (addOnServices.length) {
        await client.query(
          `INSERT INTO public.appointment_add_ons
             (appointment_id, service_id, service_price, deposit_amount)
           SELECT $1, add_on.service_id, add_on.service_price, 0
           FROM unnest($2::int[], $3::numeric[])
             AS add_on(service_id, service_price)`,
          [
            appointmentId,
            addOnServices.map((addOn) => addOn.services_id),
            addOnServices.map((addOn) => addOn.service_price),
          ],
        );
      }

      await client.query(
        `INSERT INTO public.payments
           (appointment_id, amount, currency, payment_reference, payment_status)
         VALUES ($1, $2, 'GHS', $3, 'pending')`,
        [appointmentId, DEPOSIT_CENTS / 100, reference],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    let authorizationUrl;
    try {
      authorizationUrl = await initializePaystackPayment({
        customerEmail: customerEmail.trim(),
        appointmentId,
        reference,
      });
    } catch (error) {
      try {
        await pool.query(
          `UPDATE public.payments
           SET payment_status = 'failed'
           WHERE payment_reference = $1 AND payment_status = 'pending'`,
          [reference],
        );
        await pool.query(
          `UPDATE public.appointments
           SET appointment_status = 'cancelled'
           WHERE appointments_id = $1 AND appointment_status = 'pending_payment'`,
          [appointmentId],
        );
      } catch (cleanupError) {
        return next(cleanupError);
      }
      console.error("Paystack payment initialization failed:", {
        status: error.paystackStatus || null,
        message: error.paystackMessage || error.message,
      });
      return res.status(502).json({
        message: error.paystackMessage
          ? `Paystack could not start the deposit payment: ${error.paystackMessage}`
          : "Could not connect to Paystack to start the deposit payment. Please try again.",
      });
    }

    return res.status(201).json({
      message: "Continue to Paystack to pay the non-refundable deposit.",
      authorizationUrl,
      reference,
      appointment: {
        id: appointmentId,
        customerName: customerName.trim(),
        service: service.service_name,
        addOns: addOnServices.map((addOn) => addOn.service_name),
        price: totalCents / 100,
        depositAmount: DEPOSIT_CENTS / 100,
        bookingDate,
        bookingTime,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function verifyBookingPayment(req, res, next) {
  const reference = req.query.reference;
  if (typeof reference !== "string" || !reference.trim()) {
    return res.status(400).json({ message: "A payment reference is required." });
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return res.status(503).json({
      message: "Online payments are not configured. Please contact the salon.",
    });
  }

  try {
    const { rows } = await pool.query(
      `SELECT payment_id AS id, appointment_id AS "appointmentId",
              amount, payment_status AS status
       FROM public.payments
       WHERE payment_reference = $1`,
      [reference],
    );
    const payment = rows[0];
    if (!payment) {
      return res.status(404).json({ message: "Payment reference was not found." });
    }
    if (payment.status === "successful") {
      return res.json({ success: true, message: "Deposit payment confirmed." });
    }
    if (payment.status !== "pending") {
      return res.status(400).json({
        message: "This payment is no longer pending. Please submit a new booking.",
      });
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      },
    );
    const result = await response.json();
    const verifiedPayment = result.data;
    const amountInCents = Math.round(Number(payment.amount) * 100);

    if (
      !response.ok ||
      !result.status ||
      verifiedPayment?.status !== "success" ||
      verifiedPayment?.reference !== reference ||
      verifiedPayment?.currency !== "GHS" ||
      Number(verifiedPayment?.amount) !== amountInCents
    ) {
      return res.status(400).json({
        message: "The GH₵50 deposit has not been confirmed. Your appointment is not yet secured.",
      });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows: lockedPayments } = await client.query(
        `SELECT payment_status
         FROM public.payments
         WHERE payment_reference = $1
         FOR UPDATE`,
        [reference],
      );
      if (lockedPayments[0]?.payment_status === "successful") {
        await client.query("COMMIT");
        return res.json({ success: true, message: "Deposit payment confirmed." });
      }
      if (lockedPayments[0]?.payment_status !== "pending") {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "This payment is no longer pending. Please submit a new booking.",
        });
      }

      await client.query(
        `UPDATE public.payments
         SET payment_status = 'successful',
             payment_method = $2,
             paid_at = CURRENT_TIMESTAMP
         WHERE payment_reference = $1`,
        [reference, verifiedPayment.channel || "Paystack"],
      );
      await client.query(
        `UPDATE public.appointments
         SET appointment_status = 'confirmed'
         WHERE appointments_id = $1 AND appointment_status = 'pending_payment'`,
        [payment.appointmentId],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return res.json({ success: true, message: "Deposit payment confirmed." });
  } catch (error) {
    return next(error);
  }
}
