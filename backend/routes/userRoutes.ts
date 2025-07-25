import express from "express";
import pool from "../db.ts";
import upload from "./multerConfig.ts";

interface AuthenticatedRequest extends express.Request {
  userId?: number;
}

const router = express.Router();

// Get user data
router.get(
  "/",
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(500).json({ message: "Authentication error." });
        return;
      }

      const user = await pool.query(
        `
        SELECT createdAt, username, nickname, avatar, bio
        FROM users
        WHERE id = $1
        `,
        [userId]
      );

      const friends = await pool.query(
        `
        SELECT u.username, u.nickname, u.avatar, u.bio
        FROM friends f
        JOIN users u
          ON (u.id = f.friend_id AND f.user_id = $1)
          OR (u.id = f.user_id AND f.friend_id = $1)
        `,
        [userId]
      );

      const incomingFR = await pool.query(
        `
          SELECT u.username, u.nickname, u.avatar, u.bio
          FROM friend_requests fr
          JOIN users u
            ON u.id = fr.requester_id
            WHERE fr.receiver_id = $1
          `,
        [userId]
      );

      const outgoingFR = await pool.query(
        `
        SELECT u.username, u.nickname, u.avatar, u.bio
        FROM friend_requests fr
        JOIN users u
          ON u.id = fr.receiver_id
          WHERE fr.requester_id = $1
        `,
        [userId]
      );

      const userData = {
        createdAt: user.rows[0].createdAt,
        username: user.rows[0].username,
        nickname: user.rows[0].nickname,
        avatar: user.rows[0].avatar,
        bio: user.rows[0].bio,
        friends: friends.rows,
        friendRequests: incomingFR.rows,
        friendRequestsSent: outgoingFR.rows,
      };

      res.status(200).json({ userData });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
      return;
    }
  }
);

// Update user data
router.put(
  "/",
  upload.single("newAvatar"),
  async (req: AuthenticatedRequest, res: express.Response) => {
    const client = await pool.connect();
    try {
      const userId = req.userId;
      const { newUsername, newNickname } = req.body;
      const newBio = req.body.newBio || "";
      const newAvatar = req.file ? `/uploads/${req.file.filename}` : null;

      if (!userId) {
        res.status(500).json({ message: "Authentication error." });
        return;
      }

      if (
        typeof newUsername !== "string" ||
        typeof newNickname !== "string" ||
        typeof newBio !== "string"
      ) {
        res.status(400).json({ message: "One or more fields were invalid.s" });
        return;
      }

      if (newUsername.length >= 12) {
        res.status(400).json({
          message:
            "Username too long. Usernames must be 12 characters or shorter.",
        });
        return;
      }

      if (newNickname.length >= 12) {
        res.status(400).json({
          message:
            "Nickname too long. Nicknames must be 12 characters or shorter.",
        });
        return;
      }

      if (newBio.length >= 50) {
        res.status(400).json({
          message: "Bio too long. User bios must be 50 characters or shorter.",
        });
        return;
      }

      // Get fields from the user to determine if fields have been modified or not
      const currentUser = await client.query(
        `
        SELECT username, nickname, avatar, bio
        FROM users
        WHERE id = $1
        `,
        [userId]
      );

      if (!currentUser) {
        res.status(400).json({ message: "Current user could not be found." });
        return;
      }

      const updatedData: string[] = [];
      const values: string[] = [];
      let index = 1;

      // Dynamically update the query depending on which fields are being modified
      if (newUsername && currentUser.rows[0].username !== newUsername) {
        updatedData.push(`username = $${index++}`);
        values.push(newUsername);
      }

      if (newNickname && currentUser.rows[0].nickname !== newNickname) {
        updatedData.push(`nickname = $${index++}`);
        values.push(newNickname);
      }

      if (newAvatar && currentUser.rows[0].avatar !== newAvatar) {
        updatedData.push(`avatar = $${index++}`);
        values.push(newAvatar);
      }

      if (newBio && currentUser.rows[0].bio !== newBio) {
        updatedData.push(`bio = $${index++}`);
        values.push(newBio);
      }

      if (updatedData.length === 0) {
        res.status(403).json({ message: "Fields were not modified." });
        return;
      }

      // Check if the new username is taken or not
      if (newUsername && newUsername !== currentUser.rows[0].username) {
        const usernameIsTaken = await client.query(
          `
          SELECT 1
          FROM users
          WHERE username = $1
          `,
          [newUsername]
        );

        if (usernameIsTaken.rows.length !== 0) {
          res.status(403).json({ message: "Username is taken." });
          return;
        }
      }

      await client.query(
        `
        UPDATE users
        SET ${updatedData.join(" ,")}
        WHERE id = $${index}
        `,
        [...values, userId]
      );

      res.status(200).json({ message: "User successfully updated" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Send a friend request
router.post(
  "/sendFriendRequest",
  async (req: AuthenticatedRequest, res: express.Response) => {
    const client = await pool.connect();
    try {
      const userId = req.userId;
      const { userToAdd } = req.body;

      if (!userId) {
        res.status(500).json({ message: "Authentication error." });
        return;
      }

      // Check if valid user to add is provided
      if (!userToAdd || typeof userToAdd !== "string") {
        res.status(400).json({ message: "User to add was not provided." });
      }

      await client.query("BEGIN");

      // Check if the user to be added is not the current user, a friend, or someone without an outgoing / incoming friend request (and grab the id)
      // Could combine this into the insert query, but this is much more clear and displays intent
      const userToAddIsValid = await client.query(
        `
      SELECT u.id
      FROM users u
      WHERE u.username = $1
        AND u.id != $2
        AND NOT EXISTS (
          SELECT 1 FROM friends f
          WHERE (f.user_id = u.id AND f.friend_id = $2)
            OR (f.friend_id = u.id AND f.user_id = $2)
        )
        AND NOT EXISTS (
          SELECT 1 FROM friend_requests fr
          WHERE (fr.requester_id = u.id AND fr.receiver_id = $2)
            OR (fr.receiver_id = u.id AND fr.requester_id = $2)
        )
        AND NOT EXISTS (
          SELECT 1 FROM blocked_users bu
          WHERE (bu.blocker_id = u.id AND bu.blocked_id = $2)
            OR (bu.blocked_id = u.id AND bu.blocker_id = $2)
        )
      `,
        [userToAdd, userId]
      );

      if (userToAddIsValid.rows.length === 0) {
        res.status(404).json({ message: "Specified user is invalid." });
        return;
      }

      const userToAddId = userToAddIsValid.rows[0].id;

      await client.query(
        `
        INSERT INTO friend_requests (requester_id, receiver_id)
        VALUES ($1, $2)
        `,
        [userId, userToAddId]
      );

      await client.query("COMMIT");

      res.status(200).json({ message: "Friend request successfully sent." });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    } finally {
      client.release();
    }
  }
);

// Accept a friend request
router.post(
  "/acceptRequest",
  async (req: AuthenticatedRequest, res: express.Response) => {
    const client = await pool.connect();
    try {
      const userId = req.userId;
      const { requestingUser } = req.body; // The requesting user's username

      if (!userId) {
        res.status(500).json({ message: "Authentication error." });
        return;
      }

      // Check if valid requesting user is provided
      if (!requestingUser || typeof requestingUser !== "string") {
        res.status(400).json({ message: "Requesting user was not provided." });
        return;
      }

      client.query("BEGIN");

      // Ensure the user that is being added is valid (actually exists and is not the current user) and grab its id
      const addedUserIsValid = await client.query(
        `
      SELECT id
      FROM users
      WHERE username = $1
        AND id != $2
      `,
        [requestingUser, userId]
      );

      if (addedUserIsValid.rows.length === 0) {
        res.status(400).json({ message: "User to friend could not be found." });
        return;
      }

      const addedUserId = addedUserIsValid.rows[0].id;

      // Ensure that the request the user is accepting actually exists
      const requestExists = await client.query(
        `
        SELECT 1
        FROM friend_requests
        WHERE requester_id = $1
          AND receiver_id = $2
        `,
        [addedUserId, userId]
      );

      if (requestExists.rows.length === 0) {
        res.status(400).json({ message: "Friend request could not be found." });
        return;
      }

      // Insert new record into the friends table
      await client.query(
        `
      INSERT INTO friends (user_id, friend_id)
      VALUES ($1, $2)
      `,
        [addedUserId, userId]
      );

      // Delete the corresponding friend_request record
      await client.query(
        `
      DELETE FROM friend_requests
      WHERE requester_id = $1
        AND receiver_id = $2
      `,
        [addedUserId, userId]
      );

      client.query("COMMIT");

      res.json({ message: "Successfully friended user." });
    } catch (err) {
      client.query("ROLLBACK");
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    } finally {
      client.release();
    }
  }
);

// Decline a friend request
router.delete(
  "/declineRequest",
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const userId = req.userId;
      const { userToDecline } = req.body;

      if (!userId) {
        res.status(500).json({ message: "Authentication error." });
        return;
      }

      // Check if valid user to decline is provided
      if (!userToDecline || typeof userToDecline !== "string") {
        res.status(400).json({ message: "User to decline was not provided." });
        return;
      }

      // Ensure user to decline exists (and grab its id)
      const userToDeclineExists = await pool.query(
        `
        SELECT id
        FROM users
        WHERE username = $1
        `,
        [userToDecline]
      );

      if (userToDeclineExists.rows.length === 0) {
        res
          .status(404)
          .json({ message: "User to decline could not be found." });
        return;
      }

      const userToDeclineId = userToDeclineExists.rows[0].id;

      const requestExists = await pool.query(
        `
      SELECT 1
      FROM friend_requests
      WHERE receiver_id = $1
      AND requester_id = $2
      AND EXISTS
      `,
        [userId, userToDeclineId]
      );

      if (requestExists.rows.length === 0) {
        res
          .status(404)
          .json({ message: "Request to decline could not be found." });
        return;
      }

      await pool.query(
        `
      DELETE FROM friend_requests
      WHERE receiver_id = $1
        AND requester_id = $2
      `,
        [userId, userToDeclineId]
      );

      res
        .status(200)
        .json({ message: "Successfully declined friend request." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Cancel a friend request
router.delete(
  "/cancelRequest",
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const userId = req.userId;
      const { userToCancel } = req.body;

      if (!userId) {
        res.status(500).json({ message: "Authentication error." });
        return;
      }

      if (!userToCancel || typeof userToCancel !== "string") {
        res
          .status(500)
          .json({ message: "User to cancel request to was not provided." });
        return;
      }

      // Ensure that the user's who's request is being rescinded exists (and grab its id)
      const userToCancelExists = await pool.query(
        `
      SELECT id
      FROM users
      WHERE username = $1
      `,
        [userToCancel]
      );

      if (userToCancelExists.rows.length === 0) {
        res.status(404).json({ message: "User to cancel could not be found." });
        return;
      }

      const userToCancelId = userToCancelExists.rows[0].id;

      // Ensure that the request to cancel exists
      const requestExists = await pool.query(
        `
      SELECT 1
      FROM friend_requests
      WHERE requester_id = $1
      AND receiver_id = $2
      `,
        [userId, parseInt(userToCancelId)]
      );

      if (requestExists.rows.length === 0) {
        res
          .status(404)
          .json({ message: "Request to cancel could not be found." });
        return;
      }

      await pool.query(
        `
      DELETE FROM friend_requests
      WHERE requester_id = $1
      AND receiver_id = $2
      `,
        [userId, userToCancelId]
      );

      res
        .status(200)
        .json({ message: "Successfully cancelled friend request." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Unfriend a user
router.put(
  "/unfriend",
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const userId = req.userId;
      const { userToUnfriend } = req.body;

      if (!userId) {
        res.status(500).json({ message: "Authentication error." });
        return;
      }

      // Ensure the user to unfriend is valid
      if (!userToUnfriend || typeof userToUnfriend !== "string") {
        res.status(400).json({ message: "User to unfriend not provided." });
        return;
      }

      // Ensure the user to unfriend exists (and grab its id)
      const userToUnfriendExists = await pool.query(
        `
        SELECT id
        FROM users
        WHERE username = $1
        `,
        [userToUnfriend]
      );

      if (userToUnfriendExists.rows.length === 0) {
        res
          .status(404)
          .json({ message: "User to unfriend could not be found." });
        return;
      }

      const userToUnfriendId = userToUnfriendExists.rows[0].id;

      await pool.query(
        `
        DELETE FROM friends f
        WHERE (f.user_id = $1 AND f.friend_id = $2)
        OR (f.friend_id = $1 AND f.user_id = $2)
        `,
        [userId, userToUnfriendId]
      );

      res.status(200).json({ message: "Successfully unfriended user." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Block a user
router.put(
  "/block",
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const userId = req.userId;
      const { userToBlock } = req.body;

      if (!userId) {
        res.status(500).json({ message: "Authentication error." });
        return;
      }

      // Ensure user to block is valid
      if (!userToBlock || typeof userToBlock !== "string") {
        res.status(400).json({ message: "User to block not provided." });
        return;
      }

      // Check if the user to block exists (and grab its id)
      const userToBlockExists = await pool.query(
        `
        SELECT id
        FROM users
        WHERE username = $1
        `,
        [userToBlock]
      );

      if (userToBlockExists.rows.length === 0) {
        res.status(404).json({ message: "User to block could not be found." });
        return;
      }

      const userToBlockId = userToBlockExists.rows[0].id;

      if (userToBlockId === userId) {
        res.status(400).json({ message: "Users cannot block themselves." });
      }

      await pool.query(
        `
        INSERT INTO blocked_users (blocker_id, blocked_id)
        VALUES ($1, $2)
        `,
        [userId, userToBlockId]
      );

      res.status(200).json({ message: "Successfully blocked user." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Unblock a user
router.put(
  "/unblock",
  async (req: AuthenticatedRequest, res: express.Response) => {
    try {
      const userId = req.userId;
      const { userToUnblock } = req.body;

      if (!userId) {
        res.status(500).json({ message: "Authentication error." });
        return;
      }

      if (!userToUnblock || typeof userToUnblock !== "string") {
        res.status(400).json({ message: "User to unblock not provided." });
      }

      // Ensure the user to unblock exists (and grab its id)
      const userToUnblockExists = await pool.query(
        `
        SELECT id
        FROM users
        WHERE username = $1
        `,
        [userToUnblock]
      );

      if (userToUnblockExists.rows.length === 0) {
        res
          .status(404)
          .json({ message: "User to unblock could not be found." });
        return;
      }

      const userToUnblockId = userToUnblockExists.rows[0].id;

      await pool.query(
        `
        DELETE FROM blocked_users
        WHERE blocker_id = $1
        AND blocked_id = $2
        `,
        [userId, userToUnblockId]
      );

      res.status(200).json({ message: "Successfully unblocked user." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

export default router;
