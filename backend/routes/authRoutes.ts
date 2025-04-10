/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../PrismaClient.ts";

const router = express.Router();

// Register a new user
router.post(
  "/register",
  async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { email, password, username, nickname } = req.body;

      // Ensure that all fields were provided
      if (!email || !password || !username || !nickname) {
        return res
          .status(400)
          .json({ message: "One or more fields were not provided." });
      }

      // Ensure password length is 8 or greater
      if (password.length <= 8) {
        return res.status(400).json({
          message:
            "Password is too short. Password must be 7 digits or longer.",
        });
      }

      // Check if email is in use
      const emailIsTaken = await prisma.user.findUnique({
        where: {
          email: email,
        },
        select: {
          email: true,
        },
      });

      if (emailIsTaken) {
        return res.status(400).json({
          message: "Email in use. Please choose a new email or log in.",
        });
      }

      // Check if username is in use
      const usernameIsTaken = await prisma.user.findUnique({
        where: {
          username: username,
        },
        select: {
          email: true,
        },
      });

      if (usernameIsTaken) {
        return res.status(400).json({
          message: "Username in use. Please choose a new username or log in.",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hashSync(password, 8);

      // Create new user
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

      return res.status(200).json({ token: token });
    } catch (err) {
      console.log(err);
    }
  }
);

// Login a user
router.post(
  "/login",
  async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        // Get information for user associated with email
        where: {
          email: email,
        },
        select: {
          id: true,
          email: true,
          password: true,
        },
      });

      if (!user) {
        return res.status(400).json({ message: "User not found." });
      }

      const passwordIsValid = bcrypt.compareSync(password, user.password);

      if (!passwordIsValid) {
        return res.status(400).json({ message: "Invalid password." });
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      res.status(200).json({ token: token });
    } catch (err) {
      console.log(err);
    }
  }
);

export default router;
