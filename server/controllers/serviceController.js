import pool from "../config/database.js";

export async function listServices(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT
         c.category_id,
         c.category_name,
         s.services_id,
         s.service_name,
         s.service_description,
         s.service_price,
         s.deposit_amount,
         s.duration_minutes
       FROM public.category AS c
       LEFT JOIN public.services AS s
         ON s.category_id = c.category_id
         AND s.is_active = TRUE
       ORDER BY c.category_name, s.service_name`,
    );

    const categoriesById = new Map();
    const services = [];

    for (const row of rows) {
      let category = categoriesById.get(row.category_id);
      if (!category) {
        category = {
          id: row.category_id,
          name: row.category_name,
          services: [],
        };
        categoriesById.set(row.category_id, category);
      }

      if (row.services_id === null) {
        continue;
      }

      const service = {
        id: row.services_id,
        serviceName: row.service_name,
        description: row.service_description,
        price: row.service_price,
        depositAmount: row.deposit_amount,
        durationMinutes: row.duration_minutes,
        categoryId: row.category_id,
        categoryName: row.category_name,
      };

      category.services.push(service);
      services.push(service);
    }

    res.json({ categories: [...categoriesById.values()], services });
  } catch (error) {
    next(error);
  }
}
