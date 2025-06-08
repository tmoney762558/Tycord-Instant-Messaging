import { Pool } from "pg";

const pool = new Pool({
    user: "tylerthomas",
    host: "host.docker.internal",
    database: "tycord",
    password: "0905",
    port: 5433,
});

export default pool;
