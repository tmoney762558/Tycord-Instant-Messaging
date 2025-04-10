/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import prisma from "../PrismaClient.ts";
import upload from "./multerConfig.ts";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

declare global {
  namespace Express {
    interface Request {
      file?: any;
    }
  }
}

const router = express.Router();

// Get all conversations for a user
router.get(
  "/",
  async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const userId = req.userId;

      const conversations = await prisma.conversation.findMany({
        where: {
          users: {
            some: {
              id: userId,
            },
          },
        },
        select: {
          id: true,
          name: true,
          image: true,
        },
      });

      return res.status(200).json(conversations);
    } catch (err) {
      console.log(err);
    }
  }
);

// Create a new conversation
router.post(
  "/",
  upload.single("conversationImg"),
  async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { conversationName } = req.body;
      const recipientUsernames = JSON.parse(req.body.recipientUsernames);
      const conversationImg = req.file ? `/uploads/${req.file.filename}` : null;
      const userId = req.userId;

      // Get current user's id to add to the recipients
      const currentUser = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          username: true,
        },
      });

      if (!currentUser) {
        return res
          .status(400)
          .json({ message: "The current user could not be found." });
      }

      // Gathers all valid recipients (Existing users and those who are not blocked) NOTE: Users can make conversations with only themselves. This is intentional.
      const validRecipients = await prisma.user.findMany({
        where: {
          username: {
            in: recipientUsernames,
          },
          blockedUsers: {
            none: {
              id: userId,
            },
          },
        },
      });

      // Check if all the entered usernames had a corresponding account
      if (validRecipients.length !== recipientUsernames.length) {
        return res.send({ message: "One or more recipients was not found." });
      }

      // If all works correctly, create the conversation and link it to each of the valid accounts (as well as the creator's account)
      const conversation = await prisma.conversation.create({
        data: {
          name: conversationName,
          image: conversationImg || "",
          users: {
            connect: [
              { username: currentUser.username },
              ...recipientUsernames.map((recipientUsername) => {
                return { username: recipientUsername };
              }),
            ],
          },
        },
      });

      return res.status(200).json(conversation);
    } catch (err) {
      console.log(err);
    }
  }
);

// Remove a user from a conversation and delete the conversation if 1 user is remaining
router.delete(
  "/:convoId",
  async (req: express.Request, res: express.Response): Promise<any> => {
    try {
      const { convoId } = req.params;
      const userId = req.userId;

      const conversation = await prisma.conversation.findUnique({
        where: {
          id: parseInt(convoId),
          users: {
            some: {
              id: userId,
            },
          },
        },
        select: {
          users: {
            select: {
              username: true,
            },
          },
        },
      });

      if (!conversation) {
        res.status(400).send({ message: "Conversation not found." });
        return;
      }

      // Delete entire conversation if less than 2 users remain
      if (conversation.users.length <= 2) {
        // Delete all messages in a conversation before deleting the conversation
        await prisma.message.deleteMany({
          where: {
            conversationId: parseInt(convoId),
          },
        });

        // Delete conversation
        const deletedConversation = await prisma.conversation.delete({
          where: {
            id: parseInt(convoId),
          },
          select: {
            name: true,
          },
        });

        return res.status(200).json(deletedConversation);
      } else {
        // Simply remove the user if 2 or more users remain within the conversation
        const updatedConversation = await prisma.conversation.update({
          where: {
            id: parseInt(convoId),
          },
          data: {
            users: {
              disconnect: {
                id: userId,
              },
            },
          },
        });
        return res.status(200).json(updatedConversation);
      }
    } catch (err) {
      console.log(err);
    }
  }
);

export default router;
