// Admin management APIs read and mutate the existing salon tables without exposing them publicly.
import process from "node:process";
import { Buffer } from "node:buffer";
import pool from "../config/database.js";
import {
  deletePortfolioImage,
  isValidStoragePath,
  uploadPortfolioImage as uploadImageToSupabase,
} from "../config/supabaseStorage.js";
import { hashPassword } from "../utils/passwords.js";

const toId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function getAdminDashboard(req, res, next) {
  try {
    const [appointments, categories, services, portfolio, employees] = await Promise.all([
      pool.query(
        `SELECT a.appointments_id AS id, a.customer_name AS "customerName",
                a.customer_email AS "customerEmail", a.customer_phone AS "customerPhone",
                to_char(a.appointment_datetime, 'YYYY-MM-DD HH24:MI') AS "appointmentDatetime",
                a.appointment_status AS status, a.service_price AS price,
                a.deposit_amount AS "depositAmount", s.service_name AS "serviceName",
                COALESCE(
                  (SELECT json_agg(json_build_object(
                     'serviceId', ao.service_id,
                     'serviceName', addon.service_name,
                     'price', ao.service_price,
                     'depositAmount', ao.deposit_amount
                   ) ORDER BY addon.service_name)
                   FROM public.appointment_add_ons AS ao
                   JOIN public.services AS addon ON addon.services_id = ao.service_id
                   WHERE ao.appointment_id = a.appointments_id),
                  '[]'::json
                ) AS "addOns"
         FROM public.appointments AS a
         JOIN public.services AS s ON s.services_id = a.service_id
         ORDER BY a.appointment_datetime DESC`,
      ),
      pool.query(
        `SELECT category_id AS id, category_name AS name
         FROM public.category ORDER BY category_name`,
      ),
      pool.query(
        `SELECT s.services_id AS id, s.service_name AS "serviceName",
                s.service_description AS description, s.service_price AS price,
                s.deposit_amount AS "depositAmount", s.duration_minutes AS "durationMinutes",
                s.category_id AS "categoryId", s.is_active AS active
         FROM public.services AS s ORDER BY s.service_name`,
      ),
      pool.query(
        `SELECT portfolio_id AS id, image_url AS "imageUrl",
                portfolio_title AS title, portfolio_description AS description,
                services_id AS "serviceId", storage_path AS "storagePath"
         FROM public.portfolio ORDER BY portfolio_id DESC`,
      ),
      pool.query(
        `SELECT users_id AS id, user_email AS email, created_at AS "createdAt"
         FROM public.users
         WHERE user_role = 'Employee'
         ORDER BY user_email`,
      ),
    ]);

    return res.json({
      appointments: appointments.rows,
      categories: categories.rows,
      services: services.rows,
      portfolio: portfolio.rows,
      employees: employees.rows,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createEmployeeAccount(req, res, next) {
  const email = typeof req.body?.email === "string"
    ? req.body.email.trim().toLowerCase()
    : "";
  const password =
    typeof req.body?.password === "string" ? req.body.password : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
    return res.status(400).json({ message: "Enter a valid employee email address." });
  }
  if (password.length < 12 || password.length > 1024) {
    return res.status(400).json({
      message: "The initial password must be between 12 and 1024 characters.",
    });
  }

  try {
    const { rows: existingAccounts } = await pool.query(
      `SELECT 1 FROM public.users WHERE lower(user_email) = $1 LIMIT 1`,
      [email],
    );
    if (existingAccounts.length) {
      return res.status(409).json({ message: "An account with that email already exists." });
    }

    const passwordHash = await hashPassword(password);
    const { rows } = await pool.query(
      `INSERT INTO public.users (user_role, user_email, user_password_hash)
       VALUES ('Employee', $1, $2)
       RETURNING users_id AS id, user_email AS email, created_at AS "createdAt"`,
      [email, passwordHash],
    );
    return res.status(201).json({ employee: rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "An account with that email already exists." });
    }
    return next(error);
  }
}

export async function createCategory(req, res, next) {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name || name.length > 100) {
    return res.status(400).json({ message: "Category name is required (100 characters max)." });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO public.category (category_name)
       VALUES ($1) RETURNING category_id AS id, category_name AS name`,
      [name],
    );
    return res.status(201).json({ category: rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "A category with that name already exists." });
    }
    return next(error);
  }
}

export async function updateCategory(req, res, next) {
  const id = toId(req.params.id);
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!id || !name || name.length > 100) {
    return res.status(400).json({ message: "Provide a valid category and name." });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE public.category SET category_name = $2
       WHERE category_id = $1
       RETURNING category_id AS id, category_name AS name`,
      [id, name],
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Category not found." });
    }
    return res.json({ category: rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "A category with that name already exists." });
    }
    return next(error);
  }
}

export async function deleteCategory(req, res, next) {
  const id = toId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "Provide a valid category." });
  }

  try {
    const { rows: services } = await pool.query(
      `SELECT 1 FROM public.services WHERE category_id = $1 LIMIT 1`,
      [id],
    );
    if (services.length) {
      return res.status(409).json({
        message: "Move or remove this category's services before deleting it.",
      });
    }

    const { rowCount } = await pool.query(
      `DELETE FROM public.category WHERE category_id = $1`,
      [id],
    );
    if (!rowCount) {
      return res.status(404).json({ message: "Category not found." });
    }
    return res.status(204).end();
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        message: "Move or remove this category's services before deleting it.",
      });
    }
    return next(error);
  }
}

function readService(body) {
  const serviceName =
    typeof body?.serviceName === "string" ? body.serviceName.trim() : "";
  const description =
    typeof body?.description === "string" ? body.description.trim() : "";
  const categoryId = toId(body?.categoryId);
  const price = Number(body?.price);
  const depositAmount = Number(body?.depositAmount);
  const durationMinutes = Number(body?.durationMinutes);

  if (
    !serviceName ||
    serviceName.length > 150 ||
    description.length > 5000 ||
    !categoryId ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isFinite(depositAmount) ||
    depositAmount < 0 ||
    depositAmount > price ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0
  ) {
    return null;
  }

  return { serviceName, description, categoryId, price, depositAmount, durationMinutes };
}

export async function createService(req, res, next) {
  const service = readService(req.body);
  if (!service) {
    return res.status(400).json({ message: "Complete all service fields with valid values." });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO public.services
         (service_name, service_description, service_price, deposit_amount,
          duration_minutes, category_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING services_id AS id`,
      [
        service.serviceName,
        service.description || null,
        service.price,
        service.depositAmount,
        service.durationMinutes,
        service.categoryId,
      ],
    );
    return res.status(201).json({ id: rows[0].id });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(400).json({ message: "Choose an existing category." });
    }
    return next(error);
  }
}

export async function updateService(req, res, next) {
  const id = toId(req.params.id);
  const service = readService(req.body);
  if (!id || !service || typeof req.body?.active !== "boolean") {
    return res.status(400).json({ message: "Complete all service fields with valid values." });
  }

  try {
    const { rowCount } = await pool.query(
      `UPDATE public.services
       SET service_name = $2, service_description = $3, service_price = $4,
           deposit_amount = $5, duration_minutes = $6, category_id = $7, is_active = $8
       WHERE services_id = $1`,
      [
        id,
        service.serviceName,
        service.description || null,
        service.price,
        service.depositAmount,
        service.durationMinutes,
        service.categoryId,
        req.body.active,
      ],
    );
    if (!rowCount) {
      return res.status(404).json({ message: "Service not found." });
    }
    return res.status(204).end();
  } catch (error) {
    if (error.code === "23503") {
      return res.status(400).json({ message: "Choose an existing category." });
    }
    return next(error);
  }
}

export async function deactivateService(req, res, next) {
  const id = toId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "Provide a valid service." });
  }

  try {
    const { rowCount } = await pool.query(
      `UPDATE public.services SET is_active = FALSE WHERE services_id = $1`,
      [id],
    );
    if (!rowCount) {
      return res.status(404).json({ message: "Service not found." });
    }
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
}

export async function uploadPortfolioImage(req, res, next) {
  const contentType = req.get("content-type")?.split(";")[0].trim().toLowerCase();
  const image = Buffer.isBuffer(req.body) ? req.body : null;
  if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
    return res.status(415).json({ message: "Upload a JPEG, PNG, or WebP image." });
  }
  if (!image?.length || image.length > 5 * 1024 * 1024) {
    return res.status(400).json({ message: "Choose an image up to 5 MB." });
  }

  const validSignature =
    (contentType === "image/jpeg" &&
      image.length >= 3 &&
      image[0] === 0xff &&
      image[1] === 0xd8 &&
      image[2] === 0xff) ||
    (contentType === "image/png" &&
      image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (contentType === "image/webp" &&
      image.length >= 12 &&
      image.toString("ascii", 0, 4) === "RIFF" &&
      image.toString("ascii", 8, 12) === "WEBP");
  if (!validSignature) {
    return res.status(400).json({ message: "The file contents do not match the selected image type." });
  }

  try {
    const uploaded = await uploadImageToSupabase(image, contentType);
    return res.status(201).json(uploaded);
  } catch (error) {
    return next(error);
  }
}

export async function createPortfolioItem(req, res, next) {
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const description =
    typeof req.body?.description === "string" ? req.body.description.trim() : "";
  const storagePath = req.body?.storagePath;
  const serviceId =
    req.body?.serviceId === "" || req.body?.serviceId == null
      ? null
      : toId(req.body.serviceId);

  if (
    !title ||
    title.length > 100 ||
    description.length > 5000 ||
    !isValidStoragePath(storagePath) ||
    (req.body?.serviceId != null && req.body.serviceId !== "" && !serviceId)
  ) {
    return res.status(400).json({ message: "Provide a title, image, and valid optional service." });
  }

  try {
    const { projectUrl, bucket } = getPortfolioPublicUrlConfig();
    const imageUrl = `${projectUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeURIComponent(storagePath)}`;
    const { rows } = await pool.query(
      `INSERT INTO public.portfolio
         (image_url, portfolio_title, portfolio_description, services_id, storage_path)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING portfolio_id AS id, image_url AS "imageUrl",
                 portfolio_title AS title, portfolio_description AS description,
                 services_id AS "serviceId", storage_path AS "storagePath"`,
      [imageUrl, title, description || null, serviceId, storagePath],
    );
    return res.status(201).json({ item: rows[0] });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(400).json({ message: "Choose an existing service." });
    }
    return next(error);
  }
}

function getPortfolioPublicUrlConfig() {
  const projectUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "portfolio";
  if (!projectUrl) {
    throw new Error("SUPABASE_URL must be configured for the portfolio.");
  }
  return { projectUrl, bucket };
}

export async function discardPortfolioImage(req, res, next) {
  const storagePath = req.params.path;
  if (!isValidStoragePath(storagePath)) {
    return res.status(400).json({ message: "Invalid portfolio image path." });
  }

  try {
    await deletePortfolioImage(storagePath);
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
}

export async function listPortfolio(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT portfolio_id AS id, image_url AS "imageUrl",
              portfolio_title AS title, portfolio_description AS description
       FROM public.portfolio ORDER BY portfolio_id DESC`,
    );
    return res.json({ portfolio: rows });
  } catch (error) {
    return next(error);
  }
}
