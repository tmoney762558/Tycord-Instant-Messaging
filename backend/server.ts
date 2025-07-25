import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import pool from "./db.ts";
import jwt from "jsonwebtoken";
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
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://tycord-instant-messaging-hbmq.onrender.com/", // Production Link
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS Configuration
const corsOptions = {
  origin: ["/"],
  methods: "GET, POST, PUT, DELETE",
  allowedHeaders: "Content-Type, Authorization",
};

// Helmet Configuration
const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "blob:", "data:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
    },
  },
};

// Verify a user using a token
function verifyUser(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET) as {
    id: number;
  };
}

// App Security + Express
app.use(helmet(helmetOptions));
app.use(cors(corsOptions));
app.use(express.json());

// WebSocket Logic
const userSockets = new Map();

io.on("connection", (socket) => {
  // Establish web socket connection with user
  socket.on("register", async (token: string) => {
    try {
      if (!token || typeof token !== "string") {
        console.error("WebSocket Error: No Token Provided.");
        return socket.emit("error", "WebSocket Error: No Token Provided.");
      }

      const userId = verifyUser(token).id;

      const user = await pool.query(
        `
        SELECT username FROM users WHERE id = $1
        `,
        [userId]
      );

      const username = user.rows[0].username;

      userSockets.set(username, socket.id);
    } catch (err) {
      console.error(err);
    }
  });

  // Send an emit to all users who are being added to a new conversation
  socket.on("new_conversation", async (token: string, usernames: string[]) => {
    try {
      if (!token || typeof token !== "string") {
        console.error("WebSocket Error: No token provided.");
        return socket.emit("error", "WebSocket Error: No token provided.");
      }

      if (!usernames || typeof usernames !== "object") {
        console.error("WebSocket Error: No username provided.");
        return socket.emit("error", "WebSocket Error: No username provided.");
      }

      const userId = verifyUser(token).id;

      if (!userId) {
        console.error("WebSocket Error: Token is invalid.");
        return socket.emit("error", "WebSocket Error: Token is invalid.");
      }

      // Check if each receiving user is valid
      for (let i = 0; i < usernames.length; i++) {
        if (!usernames[i] || typeof usernames[i] !== "string") {
          console.error("WebSocket Error: One or more usernames is invalid.");
          return socket.emit(
            "error",
            "WebSocket Error: One or more usernames is invalid."
          );
        }

        const receivingUser = await pool.query(
          `
        SELECT 1
        FROM users
        WHERE username = $1
        `,
          [usernames[i]]
        );

        if (receivingUser.rows.length === 0) {
          console.error("WebSocket Error: Receiving user could not be found.");
          return socket.emit(
            "error",
            "WebSocket Error: Receiving user could not be found."
          );
        }
      }

      // Emit to all users who are being added to the conversation
      for (let i = 0; i < usernames.length; i++) {
        const recievingSocketId = userSockets.get(usernames[i]);
        socket.to(recievingSocketId).emit("new_conversation");
      }
    } catch (err) {
      console.error(err);
    }
  });

  // Adds the user to the room of the selected conversation
  socket.on("join_conversation", async (token: string, convoId: number) => {
    try {
      const userId = verifyUser(token).id;

      if (!token || typeof token !== "string") {
        console.error("WebSocket Error: No token provided.");
        socket.emit("error", "WebSocket Error: No token provided.");
      }

      if (!convoId || typeof convoId !== "number") {
        console.error("WebSocket Error: No conversation ID provided.");
        socket.emit("error", "WebSocket Error: No conversation ID provided.");
      }

      if (!userId) {
        console.error("WebSocket Error: Token is invalid.");
        return socket.emit("error", "WebSocket Error: Token is invalid.");
      }

      const userInConversation = await pool.query(
        `
      SELECT 1
      FROM conversation_participants
      WHERE conversation_id = $1
      AND user_id = $2
      `,
        [convoId, userId]
      );

      if (userInConversation.rows.length === 0) {
        console.error(
          "WebSocket Error: User is not authorized to view conversation."
        );
        return socket.emit(
          "error",
          "WebSocket Error: User is not authorized to view conversation."
        );
      }

      socket.join(convoId.toString());
    } catch (err) {
      console.error(err);
    }
  });

  // Send out command to all users actively viewing a conversation that updates the messages
  socket.on("new_message", async (token: string, convoId: number) => {
    try {
      const userId = verifyUser(token).id;

      if (!token || typeof token !== "string") {
        console.error("WebSocket Error: No token provided.");
        socket.emit("error", "WebSocket Error: No token provided.");
      }

      if (!convoId || typeof convoId !== "number") {
        console.error("WebSocket Error: No conversation ID provided.");
        socket.emit("error", "WebSocket Error: No conversation ID provided.");
      }

      const userInConversation = await pool.query(
        `
      SELECT 1
      FROM conversation_participants
      WHERE conversation_id = $1
        AND user_id = $2
      `,
        [convoId, userId]
      );

      if (userInConversation.rows.length === 0) {
        console.error(
          "WebSocket Error: User is not authorized to view conversation."
        );
        return socket.emit(
          "error",
          "WebSocket Error: User is not authorized to view conversation."
        );
      }

      io.to(convoId.toString()).emit("new_message");
    } catch (err) {
      console.error(err);
    }
  });

  // Send out a command to update the friends list of somebody who has been added / removed
  socket.on("friends_updated", async (token, user) => {
    try {
      if (!token || typeof token !== "string") {
        console.error("WebSocket Error: No token provided.");
        return socket.emit("error", "WebSocket Error: No token provided.");
      }

      if (!user || typeof user !== "string") {
        console.error("WebSocket Error: No username provided.");
        return socket.emit("error", "WebSocket Error: No username provided.");
      }

      // Verify the provided token
      const userId = verifyUser(token).id;

      if (!userId) {
        console.error("WebSocket Error: Token is invalid.");
        return socket.emit("error", "WebSocket Error: Token is invalid.");
      }

      // Check if the requesting user is valid
      const requestingUser = await pool.query(
        `
      SELECT 1
      FROM users
      WHERE id = $1
      `,
        [userId]
      );

      if (requestingUser.rows.length === 0) {
        console.error("WebSocket Error: Requesting user could not be found.");
        return socket.emit(
          "error",
          "WebSocket Error: Requesting user could not be found."
        );
      }

      // Check if receiving user is valid
      const receivingUser = await pool.query(
        `
        SELECT 1
        FROM users
        WHERE username = $1
        `,
        [user]
      );

      if (receivingUser.rows.length === 0) {
        console.error("WebSocket Error: Receiving user could not be found.");
        return socket.emit(
          "error",
          "WebSocket Error: Receiving user could not be found."
        );
      }

      // Emit to the user who is being added
      const recievingSocketId = userSockets.get(user);
      socket.to(recievingSocketId).emit("friends_updated");
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("closed_conversation", async (token: string, convoId: number) => {
    try {
      if (!token || typeof token !== "string") {
        console.error("WebSocket Error: No token provided.");
        return socket.emit("error", "WebSocket Error: No token provided.");
      }

      if (!convoId || typeof convoId !== "number") {
        console.error("WebSocket Error: No username provided.");
        return socket.emit("error", "WebSocket Error: No username provided.");
      }

      const userId = verifyUser(token).id;

      if (!userId) {
        console.error("WebSocket Error: Token is invalid.");
        return socket.emit("error", "WebSocket Error: Token is invalid.");
      }

      const userInConversation = await pool.query(
        `
      SELECT 1
      FROM conversation_participants
      WHERE conversation_id = $1
      AND user_id = $2
      `,
        [convoId, userId]
      );

      if (!userInConversation) {
        console.error(
          "WebSocket Error: User is not authorized to view conversation."
        );
        return socket.emit(
          "error",
          "WebSocket Error: User is not authorized to view conversation."
        );
      }

      socket.leave(convoId.toString());
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("disconnect", () => {
    // Clean up users that have disconnected
    for (const [user, id] of userSockets.entries()) {
      if (id === socket.id) {
        userSockets.delete(user);
        break;
      }
    }
  });
});

// Serve static files for the React app from the build directory
app.use(express.static(path.join(__dirname, "../public/build")));

// Serve static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API Routes
app.use("/auth", authRoutes);
app.use("/user", authMiddleware, userRoutes);
app.use("/conversations", authMiddleware, conversationRoutes);
app.use("/messages", authMiddleware, messageRoutes);

// Catch-all route to serve the react app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/build/index.html"));
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}. App is ready to go!`);
});