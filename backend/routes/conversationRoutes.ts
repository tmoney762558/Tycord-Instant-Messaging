import express from "express";
import pool from "../db.ts";
import upload from "./multerConfig.ts";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: number;
    }
  }
}

const router = express.Router();

// Get all conversations for a user
router.get(
  "/",
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(500).json({ message: "Authentication error." });
        return;
      }

      // Get all conversations in which the user is a participant
      const conversations = await pool.query(
        `
        SELECT c.id, c.name, c.image
        FROM conversations c
        JOIN conversation_participants cp
        ON c.id = cp.conversation_id
        WHERE cp.user_id = $1
        `,
        [userId]
      );

      res.status(200).json(conversations.rows);
      return;
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Create a new conversation
router.post(
  "/",
  upload.single("conversationImg"),
  async (req: express.Request, res: express.Response): Promise<void> => {
    const client = await pool.connect();
    try {
      const userId = req.userId;
      const { conversationName } = req.body;
      const recipientUsernames = JSON.parse(req.body.recipientUsernames);
      const conversationImg = req.file ? `/uploads/${req.file.filename}` : null;
      let addedSelf = false;

      if (!userId) {
        res.status(500).json({ message: "Authentication error." });
        return;
      }

      if (!conversationName || typeof conversationName !== "string") {
        res
          .status(400)
          .json({ message: "Conversation name was not provided." });
        return;
      }

      if (!recipientUsernames || recipientUsernames.length === 0) {
        res.status(400).json({ message: "Recipients were not provided." });
        return;
      }

      await client.query("BEGIN");

      // Get current user's id to add to the recipients (while checking if it exists as well)
      const userExists = await client.query(
        `
        SELECT id, username
        FROM users
        WHERE id = $1
        `,
        [userId]
      );

      if (!userExists) {
        res
          .status(400)
          .json({ message: "The current user could not be found." });
        return;
      }

      if (
        recipientUsernames.find(
          (username) => username === userExists.rows[0].username
        )
      ) {
        addedSelf = true;
      }
      // Ensure that each recipient is valid (user is not blocked and the recipient actually exists)
      const validRecipients = await client.query(
        `
          SELECT id FROM users
          WHERE username = ANY($1)
            AND id NOT IN (
              SELECT blocked_id FROM blocked_users WHERE blocker_id = $2
            )
          `,
        [recipientUsernames, userId]
      );

      // Check if all the entered usernames had a corresponding account
      if (validRecipients.rows.length !== recipientUsernames.length) {
        res.send({
          message: "One or more users have blocked you or do not exist.",
        });
        return;
      }

      let allRecipients: number[] | null = null;
      if (addedSelf) {
        allRecipients = [...validRecipients.rows.map((row) => row.id)];
      } else {
        allRecipients = [...validRecipients.rows.map((row) => row.id), userId];
      }

      // If all works correctly, create the conversation and link it to each of the valid accounts (as well as the creator's account)
      const conversation = await client.query(
        `
        INSERT INTO conversations (name, image)
        VALUES ($1, $2)
        RETURNING id
        `,
        [conversationName, conversationImg]
      );

      const conversationId = conversation.rows[0].id;

      for (let i = 0; i < allRecipients.length; i++) {
        await client.query(
          `
          INSERT INTO conversation_participants (user_id, conversation_id)
          VALUES($1, $2)
          RETURNING user_id
          `,
          [allRecipients[i], conversationId]
        );
      }

      await client.query("COMMIT");

      res.status(200).json(conversation);
      return;
    } catch (err) {
      await client.query("ROLLBACK");
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    } finally {
      client.release();
    }
  }
);

// Remove a user from a conversation and delete the conversation if no users are remaining
router.delete(
  "/:convoId",
  async (req: express.Request, res: express.Response): Promise<void> => {
    const client = await pool.connect();
    try {
      const userId = req.userId;
      const { convoId } = req.params;

      if (!userId) {
        res.status(500).json({ message: "Authentication error." });
        return;
      }

      if (!convoId || typeof convoId !== "string") {
        res.status(500).json({ message: "No conversation id provided." });
      }

      await client.query("BEGIN");

      // Check if the user is in the conversation (and therefore authorized to leave it)
      const isParticipant = await client.query(
        `
          SELECT 1
          FROM conversation_participants cp
          WHERE conversation_id = $1 AND user_id = $2
        `,
        [parseInt(convoId), userId]
      );

      // Count how many users are in the conversation (to determine next step)
      const count = await client.query(
        `
        SELECT COUNT(*)
        FROM conversation_participants
        WHERE conversation_id = $1
        `,
        [parseInt(convoId)]
      );

      if (isParticipant.rows.length === 0) {
        res.status(400).send({ message: "Conversation not found." });
        return;
      }

      // Delete entire conversation if less than 2 users remain
      if (parseInt(count.rows[0].count) <= 1) {
        await client.query(
          `
          DELETE FROM conversations
          WHERE id = $1
          `,
          [parseInt(convoId)]
        );

        await client.query("COMMIT");

        res.status(200).json({ message: "Successfully deleted conversation." });
        return;
      } else {
        // Simply remove the user if 1 or more users remain within the conversation
        await client.query(
          `
          DELETE FROM conversation_participants
          WHERE user_id = $1 AND conversation_id = $2
          `,
          [userId, parseInt(convoId)]
        );

        await client.query("COMMIT");

        res
          .status(200)
          .json({ message: "Successfully removed user from conversation." });
        return;
      }
    } catch (err) {
      await client.query("ROLLBACK");
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    } finally {
      client.release();
    }
  }
);

export default router;
