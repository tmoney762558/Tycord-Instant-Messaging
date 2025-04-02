import express from "express";
import prisma from "../PrismaClient.js";
import upload from "./multerConfig.js";

const router = express.Router();

// Get all conversations
router.get("/dev", async (req, res) => {
  const conversations = prisma.conversation.findMany();

  res.json(conversations);
});

// Delete all conversations
router.delete("/dev", async (req, res) => {
  await prisma.conversation.deleteMany();
  await prisma.message.deleteMany();
  res
    .status(200)
    .json({ message: "Successfully deleted all conversations and messages." });
});

// Get all conversations for a user
router.get("/", async (req, res) => {
  const userId = req.userId;

  try {
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

    res.json(conversations);
  } catch (err) {
    console.log(err);
  }
});

// Create a new conversation
router.post("/", upload.single("conversationImg"), async (req, res) => {
  const { conversationName } = req.body;
  const recipientUsernames = JSON.parse(req.body.recipientUsernames);
  const conversationImg = req.file ? `/uploads/${req.file.filename}` : null;
  const userId = req.userId;

  try {
    const currentUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    // Gathers all valid recipients (Existing users and those who are not blocked)
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
        image: conversationImg,
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

    return res.json(conversation);
  } catch (err) {
    console.log(err);
  }
});

// Remove a user from a conversation and delete the conversation if 1 user is remaining
router.delete("/:convoId", async (req, res) => {
  const { convoId } = req.params;
  const userId = req.userId;
  console.log(convoId);

  try {
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
        users: true,
      },
    });

    if (!conversation) {
      res.send({ message: "Conversation not found." });
      return;
    }

    const deletedMessages = await prisma.message.deleteMany({
      where: {
        conversationId: parseInt(convoId),
      },
    });

    if (conversation.users.length <= 2) {
      const deletedConversation = await prisma.conversation.delete({
        where: {
          id: parseInt(convoId),
        },
        select: {
          id: true,
          name: true,
        },
      });

      return res.json(deletedConversation);
    } else {
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
      return res.json(updatedConversation);
    }
  } catch (err) {
    console.log(err);
  }
});

export default router;
