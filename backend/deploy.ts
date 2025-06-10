import fs from "fs";
import pool from "./db.ts";

const schema = fs.readFileSync('./backend/postgres/schema.sql', "utf8");

async function deploy() {
  const client = await pool.connect();
  try {
    await client.query(schema);
    console.log("Database schema deployed successfully.");
  } catch (err) {
    console.log(err);
  } finally {
    client.release();
    await pool.end();
  }
}

deploy();
