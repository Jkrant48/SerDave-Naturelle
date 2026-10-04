// Server entry point: load environment variables and start the HTTP API.
import "dotenv/config";
import process from "node:process";
import app from "./app.js";

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`SerDave Naturelle API listening on port ${port}`);
});
