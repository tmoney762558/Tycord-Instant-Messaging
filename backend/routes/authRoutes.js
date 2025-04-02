import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../PrismaClient.js";

const router = express.Router();

// DEV ONLY: Get all users
router.get("/dev/users", async (req, res) => {
  const users =  await prisma.user.findMany();

  res.json(users);
});

// DEV ONLY: Delete all users
router.delete("/dev/users", async (req, res) => {
  const users = await prisma.user.deleteMany();

  res.json(users);
});

// DEV ONLY: Delete all conversations and messages
router.delete("/dev/delAllCM", async (req, res) => {
  const deletedMessages = await prisma.message.deleteMany();
  const deletedConversations = await prisma.conversation.deleteMany();
});

// Register a new user
router.post("/register", async (req, res) => {
  const { email, password, username, nickname } = req.body;

  const emailIsTaken = await prisma.user.findUnique({
    where: {
      email: email
    }
  })

  const usernameIsTaken = await prisma.user.findUnique({
    where: {
      username: username
    }
  })

  if (emailIsTaken) {
    return res.status(400).json({ message: "Email in use. Please choose a new email or log in."});
    
  }

  if (usernameIsTaken) {
   return res.status(400).json({ message: "Username in use. Please choose a new username or log in."});
    
  }

  if (!email || !password || !username || !nickname) {
    return res.status(400).json({ message: "One or more fields were not provided." });
   
  }

  if (password.length < 7) {
    return res.status(404).json({ message: "Password is too short. Password must be 7 digits or longer."});
  }

  const hashedPassword = await bcrypt.hashSync(password, 8);

  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      username,
      nickname,
    },
  });

  const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });

  res.json({token: token});
});

// Login a user
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const passwordIsValid = bcrypt.compareSync(password, user.password);

  if (!passwordIsValid) {
    return res.status(404).json({ message: "Invalid password." });
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });

  res.json({token: token});
});

export default router;