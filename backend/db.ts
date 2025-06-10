import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Optional: if the remote DB requires SSL
  },
});

export default pool;
