import express from "express";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import { fileURLToPath } from "url";
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

// CORS Configuration
const corsOptions = {
  origin: "/", // Adjust as needed
  methods: "GET, POST, PUT, DELETE",
  allowedHeaders: "Content-Type, Authorization",
};

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "blob:", "data:"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
      },
    },
  })
);
app.use(cors(corsOptions));
app.use(express.json());

// Serve static files for the React app
app.use(express.static(path.join(__dirname, "../public/build")));
console.log(path.join(__dirname, "../public/build"));

// Serve static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
console.log(path.join(__dirname, "../uploads"));

// API Routes
app.use("/auth", authRoutes);
app.use("/user", authMiddleware, userRoutes);
app.use("/conversations", authMiddleware, conversationRoutes);
app.use("/messages", authMiddleware, messageRoutes);

// Catch-All Route for React Router (Keep at end)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/build/index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}. App is ready to go!`);
});
