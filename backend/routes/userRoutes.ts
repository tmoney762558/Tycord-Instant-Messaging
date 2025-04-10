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

// Get user data
router.get("/", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const userId = (req as express.Request & { userId: number }).userId;

    const userData = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        createdAt: true,
        username: true,
        nickname: true,
        avatar: true,
        bio: true,
        friends: {
          select: {
            username: true,
            nickname: true,
            avatar: true,
            bio: true,
          },
        },
        friendRequests: {
          select: {
            username: true,
            nickname: true,
            avatar: true,
            bio: true,
          },
        },
        friendRequestsSent: {
          select: {
            username: true,
            nickname: true,
            avatar: true,
            bio: true,
          },
        },
      },
    });

    return res.status(200).json(userData);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update user data
router.put("/", upload.single("newAvatar"), async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const userId = (req as express.Request & { userId: number }).userId;
    const { newUsername, newNickname, newBio } = req.body;
    const newAvatar = req.file ? `/uploads/${req.file.filename}` : null;

    // Select the current state of the user to avoid unique constraint violations
    const currentUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        username: true,
        nickname: true,
        avatar: true,
        bio: true,
      },
    });

    // Check if current user can be found
    if (!currentUser) {
      return res
        .status(400)
        .json({ message: "Current user could not be found." });
    }

    const updatedData: {
      username?: string;
      nickname?: string;
      avatar?: string;
      bio?: string;
    } = {};

    if (newUsername && currentUser.username !== newUsername) {
      updatedData.username = newUsername;
    }

    if (newNickname && currentUser.nickname !== newNickname) {
      updatedData.nickname = newNickname;
    }

    if (newAvatar && currentUser.avatar !== newAvatar) {
      updatedData.avatar = newAvatar;
    }

    if (newBio && currentUser.bio !== newBio) {
      updatedData.bio = newBio;
    }

    if (Object.keys(updatedData).length === 0) {
      return res.status(403).json({ message: "Fields were not modified." });
    }

    if (updatedData.username) {
      const usernameIsTaken = await prisma.user.findUnique({
        where: {
          username: updatedData.username,
        },
      });

      if (usernameIsTaken) {
        return res.status(403).json({ message: "Username is taken." });
      }
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: updatedData,
    });

    return res.json(updatedUser);
  } catch (err) {
    console.log(err);
  }
});

// Send a friend request
router.put("/sendFriendRequest", async (req: express.Request, res: express.Response): Promise<any> => {
  const userId = (req as express.Request & { userId: number }).userId;
  const { userToAdd } = req.body;

  const userToAddIsValid = await prisma.user.findUnique({
    // Check if the user to add is valid (Requester isn't already a friend or blocked)
    where: {
      NOT: {
        id: userId,
      },
      username: userToAdd,
      friends: {
        none: {
          id: userId,
        },
      },
      friendRequests: {
        none: {
          id: userId,
        },
      },
      friendRequestsSent: {
        none: {
          username: userToAdd,
        },
      },
      blockedUsers: {
        none: {
          id: userId,
        },
      },
    },
    select: {
      username: true, // Grabs only the username to avoid getting unneccessary fields
      friends: true,
      blockedUsers: true,
    },
  });

  if (!userToAddIsValid) {
    return res.status(404).json({ message: "Specified user is invalid." });
  }

  // Adds the outgoing friend request to the user initiating the request
  const sendingUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      friendRequestsSent: {
        connect: {
          username: userToAdd,
        },
      },
    },
  });

  // Adds the friend request from user1 to user2
  await prisma.user.update({
    where: {
      username: userToAdd,
    },
    data: {
      friendRequests: {
        connect: {
          id: userId,
        },
      },
    },
  });

  return res.json(sendingUser);
});

// Accept a friend request
router.put("/acceptRequest", async (req: express.Request, res: express.Response): Promise<any> => {
  const userId = (req as express.Request & { userId: number }).userId;
  const { requestingUser } = req.body; // The requesting user's username

  const isAddingSelf = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (isAddingSelf && isAddingSelf.username === requestingUser) {
    return res.send(403).send({ message: "Users cannot add themselves!" });
  }

  const updatedAccepter = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      friendRequests: {
        disconnect: {
          username: requestingUser,
        },
      },
      friends: {
        connect: {
          username: requestingUser,
        },
      },
    },
    select: {
      username: true,
      nickname: true,
      friends: true,
      friendRequests: {
        select: {
          username: true,
          nickname: true,
          avatar: true,
          bio: true,
        },
      },
      friendRequestsSent: {
        select: {
          username: true,
          nickname: true,
          avatar: true,
          bio: true,
        },
      },
      blockedUsers: {
        select: {
          username: true,
          nickname: true,
          avatar: true,
          bio: true,
        },
      },
      avatar: true,
      bio: true,
    },
  });

  await prisma.user.update({
    where: {
      username: requestingUser,
    },
    data: {
      friendRequestsSent: {
        disconnect: {
          id: userId,
        },
      },
      friends: {
        connect: {
          username: requestingUser,
        },
      },
    },
  });

  return res.json(updatedAccepter);
});

// Decline a friend request
router.put("/declineRequest", async (req: express.Request, res: express.Response): Promise<any> => {
  const userId = (req as express.Request & { userId: number }).userId;
  const { userToDecline } = req.body;

  const requester = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!requester) {
    return res
      .status(400)
      .json({ message: "Current user could not be found." });
  }

  const declineIsValid = requester.username !== userToDecline;

  if (!declineIsValid) {
    return res
      .status(403)
      .json({ message: "User's cannot decline a request to themselves." });
  }

  const updatedDecliner = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      friendRequests: {
        disconnect: {
          username: userToDecline,
        },
      },
    },
    select: {
      username: true,
      nickname: true,
      friends: true,
      friendRequests: {
        select: {
          username: true,
          nickname: true,
          avatar: true,
          bio: true,
        },
      },
      friendRequestsSent: {
        select: {
          username: true,
          nickname: true,
          avatar: true,
          bio: true,
        },
      },
      blockedUsers: {
        select: {
          username: true,
          nickname: true,
          avatar: true,
          bio: true,
        },
      },
      avatar: true,
      bio: true,
    },
  });

  await prisma.user.update({
    where: {
      username: userToDecline,
    },
    data: {
      friendRequestsSent: {
        disconnect: {
          id: userId,
        },
      },
    },
  });

  return res.json(updatedDecliner);
});

// Cancel a friend request
router.put("/cancelRequest", async (req: express.Request, res: express.Response): Promise<any> => {
  const userId = (req as express.Request & { userId: number }).userId;
  const { userToCancel } = req.body;

  const requester = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!requester) {
    return res
      .status(400)
      .json({ message: "Current user could not be found." });
  }

  const cancelIsValid = requester.username !== userToCancel;

  if (!cancelIsValid) {
    return res
      .status(403)
      .json({ message: "User's cannot cancel a request to themselves." });
  }

  const updatedCanceler = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      friendRequestsSent: {
        disconnect: {
          username: userToCancel,
        },
      },
    },
    select: {
      username: true,
      nickname: true,
      friends: true,
      friendRequests: {
        select: {
          username: true,
          nickname: true,
          avatar: true,
          bio: true,
        },
      },
      friendRequestsSent: {
        select: {
          username: true,
          nickname: true,
          avatar: true,
          bio: true,
        },
      },
      blockedUsers: {
        select: {
          username: true,
          nickname: true,
          avatar: true,
          bio: true,
        },
      },
      avatar: true,
      bio: true,
    },
  });

  await prisma.user.update({
    // The updated user who was sent the friend request
    where: {
      username: userToCancel,
    },
    data: {
      friendRequests: {
        disconnect: {
          id: userId,
        },
      },
    },
  });

  return res.json(updatedCanceler);
});

// Unfriend a user
router.put("/unfriend", async (req: express.Request, res: express.Response): Promise<any> => {
  const userId = (req as express.Request & { userId: number }).userId;
  const { userToUnfriend } = req.body;

  const unfriendingUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      friends: {
        disconnect: {
          username: userToUnfriend,
        },
      },
    },
    select: {
      username: true,
      nickname: true,
      friends: true,
      friendRequests: {
        select: {
          username: true,
          nickname: true,
          avatar: true,
          bio: true,
        },
      },
      friendRequestsSent: {
        select: {
          username: true,
          nickname: true,
          avatar: true,
          bio: true,
        },
      },
      blockedUsers: {
        select: {
          username: true,
          nickname: true,
          avatar: true,
          bio: true,
        },
      },
      avatar: true,
      bio: true,
    },
  });

  await prisma.user.update({
    where: {
      username: userToUnfriend,
    },
    data: {
      friends: {
        disconnect: {
          id: userId,
        },
      },
    },
  });

  return res.json(unfriendingUser);
});

// Block a user
router.put("/block", async (req, res) => {
  const userId = (req as express.Request & { userId: number }).userId;
  const { userToBlock } = req.body;

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      blockedUsers: {
        connect: {
          username: userToBlock,
        },
      },
    },
    select: {
      username: true,
      nickname: true,
      friends: true,
      friendRequests: {
        select: {
          username: true,
          nickname: true,
          avatar: true,
          bio: true,
        },
      },
      friendRequestsSent: {
        select: {
          username: true,
          nickname: true,
          avatar: true,
          bio: true,
        },
      },
      blockedUsers: {
        select: {
          username: true,
          nickname: true,
          avatar: true,
          bio: true,
        },
      },
      avatar: true,
      bio: true,
    },
  });
  res.json(updatedUser);
});

export default router;
