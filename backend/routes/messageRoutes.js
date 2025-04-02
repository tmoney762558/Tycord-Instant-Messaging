import express from "express";
import prisma from "../PrismaClient.js";

const router = express.Router();

// Get all messages for a conversation
router.get("/:convoId", async (req, res) => {
  const { convoId } = req.params;
  const userId = req.userId;

  if (!convoId) {
    return res.send({ message: "Conversation ID not found." });
  }

  const userInConversation = prisma.conversation.findUnique({
    where: {
      id: parseInt(convoId),
      users: {
        some: {
          id: userId,
        },
      },
    },
  });

  if (!userInConversation) {
    return res.send({ message: "Conversation not found." });
  }

  const messages = await prisma.message.findMany({
    where: {
      conversationId: parseInt(convoId),
    },
    select: {
      id: true,
      content: true,
      user: {
        select: {
          username: true,
          nickname: true,
          avatar: true,
          bio: true,
        },
      },
    },
  });

  return res.json(messages);
});

// Create a new message
router.post("/:convoId", async (req, res) => {
  const { convoId } = req.params;
  const { messageContent } = req.body;
  const userId = req.userId;

  if (!convoId) {
    return res.send({ message: "Conversation ID not found." });
  }

  const userInConversation = await prisma.conversation.findUnique({
    where: {
      id: parseInt(convoId),
      users: {
        some: {
          id: userId,
        },
      },
    },
  });

  if (!userInConversation) {
    return res.send({ message: "Conversation not found." });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: parseInt(convoId),
      userId,
      content: messageContent,
    },
  });

  return res.json(message);
});

// Delete a message
router.delete("/:convoId", async (req, res) => {
  try {
    const userId = req.userId;
    const { convoId } = req.params;
    const { messageId } = req.body;

    const deletedMessage = await prisma.message.delete({
      where: {
        id: messageId,
        userId: userId,
        conversationId: parseInt(convoId),
      },
      select: {
        content: true,
      },
    });

    if (!deletedMessage) {
      return req.status(404).json({
        message:
          "Message could not be found. Are you authorized to delete this message?",
      });
    }

    return res.json(deletedMessage);
  } catch (err) {
    console.log(err);
  }
});

export default router;
