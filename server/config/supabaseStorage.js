// Supabase Storage is called only by the server so its service-role key stays private.
import process from "node:process";
import { randomUUID } from "node:crypto";

function getPublicStorageConfig() {
  const projectUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "SerDave-photos";

  if (!projectUrl) {
    throw createStorageError(
      "Image storage is not configured. Set SUPABASE_URL on the API server.",
      503,
    );
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(projectUrl);
  } catch (cause) {
    throw createStorageError(
      "SUPABASE_URL must be a valid Supabase project URL.",
      503,
      cause,
    );
  }
  if (!["https:", "http:"].includes(parsedUrl.protocol)) {
    throw createStorageError(
      "SUPABASE_URL must use HTTP or HTTPS.",
      503,
    );
  }

  return { projectUrl, bucket };
}

function getStorageConfig() {
  const { projectUrl, bucket } = getPublicStorageConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw createStorageError(
      "Image storage uploads are not configured. Set SUPABASE_SERVICE_ROLE_KEY on the API server.",
      503,
    );
  }
  return { projectUrl, serviceKey, bucket };
}

function createStorageError(message, status, cause) {
  const error = new Error(message, { cause });
  error.status = status;
  error.publicMessage = message;
  return error;
}

function objectUrl(projectUrl, bucket, path) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${projectUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`;
}

export function isValidStoragePath(path) {
  return (
    typeof path === "string" && /^[0-9a-f-]{36}\.(?:jpg|png|webp)$/.test(path)
  );
}

export function getPortfolioPublicUrl(storagePath) {
  if (!isValidStoragePath(storagePath)) {
    throw new Error("Invalid portfolio image path.");
  }
  const { projectUrl, bucket } = getPublicStorageConfig();
  return `${projectUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeURIComponent(storagePath)}`;
}

export async function uploadPortfolioImage(buffer, contentType) {
  const extensions = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensions[contentType];
  if (!extension) {
    throw new Error("Only JPEG, PNG, and WebP images are supported.");
  }

  const { projectUrl, serviceKey, bucket } = getStorageConfig();
  const storagePath = `${randomUUID()}.${extension}`;
  let response;
  try {
    response = await fetch(objectUrl(projectUrl, bucket, storagePath), {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": contentType,
        "x-upsert": "false",
      },
      body: buffer,
    });
  } catch (cause) {
    throw createStorageError(
      "Could not connect to Supabase Storage. Check the API server's SUPABASE_URL and network connection.",
      502,
      cause,
    );
  }

  if (!response.ok) {
    const details = await response.text();
    console.error("Supabase Storage upload rejected the image:", {
      status: response.status,
      details,
    });
    throw createStorageError(
      response.status === 404
        ? `Supabase Storage bucket "${bucket}" was not found. Create this bucket in Supabase Storage or set SUPABASE_STORAGE_BUCKET to its exact name.`
        : `Supabase Storage rejected the image upload (HTTP ${response.status}). Confirm that bucket "${bucket}" exists and the API server has the correct service-role key.`,
      response.status === 401 || response.status === 403 ? 503 : 502,
    );
  }

  const publicUrl = getPortfolioPublicUrl(storagePath);
  return { storagePath, publicUrl };
}

export async function deletePortfolioImage(storagePath) {
  if (!isValidStoragePath(storagePath)) {
    throw new Error("Invalid portfolio image path.");
  }

  const { projectUrl, serviceKey, bucket } = getStorageConfig();
  let response;
  try {
    response = await fetch(
      `${projectUrl}/storage/v1/object/${encodeURIComponent(bucket)}`,
      {
        method: "DELETE",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prefixes: [storagePath] }),
      },
    );
  } catch (cause) {
    throw createStorageError(
      "Could not connect to Supabase Storage to remove the image.",
      502,
      cause,
    );
  }

  if (!response.ok) {
    const details = await response.text();
    console.error("Supabase Storage image deletion failed:", {
      status: response.status,
      details,
    });
    throw createStorageError(
      `Supabase Storage could not remove the image (HTTP ${response.status}).`,
      502,
    );
  }

  return getPortfolioPublicUrl(storagePath);
}
