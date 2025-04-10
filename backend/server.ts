import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url"; // Required to define __dirname in ES modules
import authRoutes from "./routes/authRoutes.ts";
import authMiddleware from "./middleware/authMiddleware.ts";
import userRoutes from "./routes/userRoutes.ts";
import conversationRoutes from "./routes/conversationRoutes.ts";
import messageRoutes from "./routes/messageRoutes.ts";

const app = express();
const PORT = 3000;

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corsOptions = {
    origin: "http://localhost:5173",
    methods: "GET, POST, PUT, DELETE",
    allowedHeaders: "Content-Type, Authorization"
};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve static files from the uploads folder

app.use("/auth", authRoutes);
app.use("/user", authMiddleware, userRoutes);
app.use("/conversations", authMiddleware, conversationRoutes);
app.use("/messages", authMiddleware, messageRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});