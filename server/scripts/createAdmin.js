// Run this one-time setup command to create an admin account with a salted scrypt hash.
import "dotenv/config";
import process from "node:process";
import readline from "node:readline";
import pool from "../config/database.js";
import { hashPassword } from "../utils/passwords.js";

function ask(prompt, hidden = false) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    const output = process.stdout;
    if (!input.isTTY || (hidden && typeof input.setRawMode !== "function")) {
      reject(new Error("Run `npm run admin:create` in an interactive terminal."));
      return;
    }

    output.write(prompt);
    if (!hidden) {
      const reader = readline.createInterface({ input, output });
      reader.once("line", (answer) => {
        reader.close();
        resolve(answer);
      });
      return;
    }

    let answer = "";
    const finish = (error, value) => {
      input.setRawMode(false);
      input.pause();
      input.removeListener("data", onData);
      output.write("\n");
      if (error) {
        reject(error);
      } else {
        resolve(value);
      }
    };
    const onData = (chunk) => {
      for (const character of chunk.toString()) {
        if (character === "\u0003") {
          finish(new Error("Admin setup cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          finish(null, answer);
          return;
        }
        if (character === "\u007f" || character === "\b") {
          answer = answer.slice(0, -1);
        } else {
          answer += character;
        }
      }
    };

    input.setRawMode(true);
    input.resume();
    input.on("data", onData);
  });
}

try {
  const email = (await ask("Admin email: ")).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
    throw new Error("Enter a valid email address (255 characters max).");
  }

  const password = await ask("Admin password (12+ characters): ", true);
  if (password.length < 12 || password.length > 1024) {
    throw new Error("Admin passwords must be between 12 and 1024 characters.");
  }

  const passwordHash = await hashPassword(password);
  const { rows } = await pool.query(
    `INSERT INTO public.users (user_role, user_email, user_password_hash)
     VALUES ('Admin', $1, $2)
     ON CONFLICT (user_email) DO NOTHING
     RETURNING users_id`,
    [email, passwordHash],
  );
  if (!rows.length) {
    throw new Error("That email already exists; admin setup did not change the account.");
  }

  console.log(`Admin account created for ${email}.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
