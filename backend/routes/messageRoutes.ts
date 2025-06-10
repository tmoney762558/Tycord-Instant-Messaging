import express from "express";
import pool from "../db.ts";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: number;
    }
  }
}

const router = express.Router();

// Get all messages for a conversation
router.get(
  "/:convoId",
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const userId = req.userId;
      const { convoId } = req.params;

      if (!userId) {
        res.status(500).json({ message: "Authentication error." });
        return;
      }

      // Check if conversation ID was provided
      if (!convoId) {
        res.status(400).json({ message: "Conversation ID was not provided." });
        return;
      }

      // Check if the user is in the conversation (and therefore allowed to view the messages)
      const userInConversation = await pool.query(
        `
          SELECT 1
          FROM conversation_participants
          WHERE conversation_id = $1 AND user_id = $2
        `,
        [parseInt(convoId), userId]
      );

      if (userInConversation.rows.length === 0) {
        res.send({ message: "Conversation not found." });
        return;
      }

      const messages = await pool.query(
        `
        SELECT m.id, m.content, m.createdAt, u.username, u.nickname, u.avatar, u.bio
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE conversation_id = $1
        ORDER BY m.createdAt ASC
        `,
        [parseInt(convoId)]
      );

      res.status(200).json(messages.rows);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Create a new message
router.post(
  "/:convoId",
  async (req: express.Request, res: express.Response): Promise<void> => {
    const client = await pool.connect();
    try {
      const userId = req.userId;
      const { convoId } = req.params;
      const { messageContent } = req.body;

      if (!userId) {
        res.status(500).json({ message: "Authentication error." });
        return;
      }

      // Check if conversation ID was provided
      if (!convoId) {
        res.send({ message: "Conversation ID was not provided." });
        return;
      }

      await client.query("BEGIN");

      // Check if the user is in the conversation (and therefore allowed to send a message in said conversation)
      const userInConversation = await client.query(
        `
        SELECT 1
        FROM conversation_participants
        WHERE conversation_id = $1 AND user_id = $2
        `,
        [parseInt(convoId), userId]
      );

      if (userInConversation.rows.length === 0) {
        res.send({ message: "Conversation not found." });
        return;
      }

      const message = await client.query(
        `
        INSERT INTO messages (conversation_id, user_id, content)
        VALUES($1, $2, $3)
        `,
        [parseInt(convoId), userId, messageContent]
      );

      await client.query("COMMIT");

      res.status(200).json(message);
    } catch (err) {
      await client.query("ROLLBACK");
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    } finally {
      client.release();
    }
  }
);

// Delete a message
router.delete(
  "/:convoId",
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const userId = req.userId;
      const { convoId } = req.params;
      const { messageId } = req.body;

      if (!userId) {
        res.status(500).json({ message: "Authentication error." });
        return;
      }

      // Check if conversation ID is provided
      if (!convoId) {
        res.status(400).json({ message: "Conversation ID was not provided." });
        return;
      }

      // Check if valid message ID is provided
      if (!messageId || typeof messageId !== "string") {
        res.status(400).json({ message: "Message ID not provided." });
        return;
      }

      await pool.query(
        `
        DELETE FROM messages
        WHERE id = $1 AND user_id = $2 AND conversation_id = $3
        `,
        [parseInt(messageId), userId, parseInt(convoId)]
      );

      res.status(200).json({ message: "Successfully deleted message." });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

export default router;
