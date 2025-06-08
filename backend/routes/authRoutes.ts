import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.ts";

const router = express.Router();

// Register a new user
router.post(
  "/register",
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { email, password, username, nickname } = req.body;

      // Ensure that all fields were provided and are valid
      if (
        !email ||
        typeof email !== "string" ||
        !password ||
        typeof password !== "string" ||
        !username ||
        typeof username !== "string" ||
        !nickname ||
        typeof nickname !== "string"
      ) {
        res
          .status(400)
          .json({ message: "One or more fields were not provided." });
        return;
      }

      // Ensure email isn't astronomically large
      if (email.length >= 100) {
        res.status(400).json({
          message:
            "Email is too long. Emails must be 100 characters or shorter.",
        });
        return;
      }

      // Ensure username length is no greater than 12
      if (username.length > 12) {
        res.status(400).json({
          message:
            "Username is too long. Username must be 12 characters or shorter.",
        });
        return;
      }

      // Ensure password length is 8 or greater
      if (password.length < 8) {
        res.status(400).json({
          message:
            "Password is too short. Password must be 7 characters or longer.",
        });
        return;
      }

      // Ensure password length isn't astronomically large
      if (password.length >= 30) {
        res.status(400).json({
          message:
            "Password is too long. Password must be 30 or less characters.",
        });
        return;
      }

      // Ensure nickname length isn't astronomically large
      if (nickname.length >= 12) {
        res.status(400).json({
          message:
            "Nickname is too large. Nickname must be 12 or less characters.",
        });
        return;
      }

      // Check if email or username are in use
      const result = await pool.query(
        `
        SELECT
        EXISTS (SELECT 1 FROM users WHERE email = $1) AS email_exists,
        EXISTS (SELECT 1 FROM users WHERE username = $2) AS username_exists
        `,
        [email, username]
      );

      const emailTaken = result.rows[0].email_exists;
      const usernameTaken = result.rows[0].username_exists;

      if (emailTaken) {
        res
          .status(400)
          .json({ message: "Email is taken. Choose a new email or log in." });
        return;
      }

      if (usernameTaken) {
        res.status(400).json({
          message: "Username is taken. Choose a new username or log in.",
        });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hashSync(password, 8);

      // Create new user
      const newUser = await pool.query(
        `
        INSERT INTO users (email, username, nickname, hashed_password, avatar)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
        `,
        [email, username, nickname, hashedPassword, ""]
      );

      // Create token for new user
      const token = jwt.sign(
        { id: newUser.rows[0].id },
        process.env.JWT_SECRET || "Blah Blah"
      );

      res.status(200).json({ token });
      return;
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Login a user
router.post(
  "/login",
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (
        !email ||
        typeof email !== "string" ||
        !password ||
        typeof password !== "string"
      ) {
        res
          .status(400)
          .json({ message: "One or more fields were not provided." });
        return;
      }

      // Get information for user associated with email
      const user = await pool.query(
        `
        SELECT hashed_password
        FROM users WHERE email = $1
        `,
        [email]
      );

      if (user.rows.length === 0) {
        res.status(400).json({ message: "User not found." });
        return;
      }

      const hashedPassword = user.rows[0].hashed_password;

      // Check if the hashed password matches the one stored by the database
      const passwordIsValid = bcrypt.compareSync(password, hashedPassword);

      if (!passwordIsValid) {
        res.status(400).json({ message: "Invalid password." });
        return;
      }

      // Create token for user
      const token = jwt.sign(
        { id: user.rows[0].id },
        process.env.JWT_SECRET || "Blah Blah",
        {
          expiresIn: "24h",
        }
      );

      res.status(200).json({ token });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

export default router;
