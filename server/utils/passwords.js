// Admin credentials created by the setup script use salted scrypt hashes.
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, KEY_LENGTH, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });

  return `scrypt$${salt.toString("base64url")}$${derivedKey.toString("base64url")}`;
}

export async function verifyPassword(password, passwordHash) {
  const [algorithm, saltText, keyText] = String(passwordHash).split("$");
  if (algorithm !== "scrypt" || !saltText || !keyText) {
    return false;
  }

  try {
    const salt = Buffer.from(saltText, "base64url");
    const expectedKey = Buffer.from(keyText, "base64url");
    if (salt.length !== 16 || expectedKey.length !== KEY_LENGTH) {
      return false;
    }

    const actualKey = await scrypt(password, salt, KEY_LENGTH, {
      N: 32768,
      r: 8,
      p: 1,
      maxmem: 64 * 1024 * 1024,
    });
    return timingSafeEqual(actualKey, expectedKey);
  } catch (error) {
    if (error instanceof TypeError || error instanceof RangeError) {
      return false;
    }
    throw error;
  }
}
