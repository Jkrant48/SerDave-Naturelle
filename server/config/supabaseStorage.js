// Supabase Storage is called only by the server so its service-role key stays private.
import process from "node:process";
import { randomUUID } from "node:crypto";

function getStorageConfig() {
  const projectUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "SerDave-photos";

  if (!projectUrl || !serviceKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured for image storage.",
    );
  }

  return { projectUrl: projectUrl.replace(/\/+$/, ""), serviceKey, bucket };
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
  const response = await fetch(objectUrl(projectUrl, bucket, storagePath), {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": contentType,
      "x-upsert": "false",
    },
    body: buffer,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Supabase Storage upload failed (${response.status}): ${details}`,
    );
  }

  const publicUrl = `${projectUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeURIComponent(storagePath)}`;
  return { storagePath, publicUrl };
}

export async function deletePortfolioImage(storagePath) {
  if (!isValidStoragePath(storagePath)) {
    throw new Error("Invalid portfolio image path.");
  }

  const { projectUrl, serviceKey, bucket } = getStorageConfig();
  const response = await fetch(
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

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Supabase Storage delete failed (${response.status}): ${details}`,
    );
  }

  return `${projectUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeURIComponent(storagePath)}`;
}
