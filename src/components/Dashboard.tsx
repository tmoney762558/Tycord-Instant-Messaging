import Conversation from "./Conversation";
import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setMessages } from "../reduxStore/slices/messagesSlice";
import { useNavigate } from "react-router-dom";
import ProfileEditor from "./ProfileEditor";
import SideNav from "./SideNav";
import DirectMessagesTab from "./DirectMessagesTab";
import FriendTab from "./FriendTab";
import ConversationTab from "./ConversationTab";
import ProfileDisplay from "./ProfileDisplay";
import ConversationMenu from "./ConversationMenu";
import DeleteMessagePrompt from "./DeleteMessagePrompt";
import { socket } from "../socket.ts";

interface CurrentUser {
  createdAt: string;
  username: string;
  nickname: string;
  avatar: string;
  bio: string;
  friends: User[];
  friendRequests: FriendRequest[];
  friendRequestsSent: FriendRequest[];
}

interface User {
  username: string;
  nickname: string;
  avatar: string;
  bio: string;
}

interface FriendRequest {
  username: string;
  nickname: string;
  avatar: string;
  bio: string;
}

interface Message {
  id: number;
  createdAt: string;
  content: string;
  username: string;
  nickname: string;
  avatar: string;
  bio: string;
}

interface MessageState {
  messages: {
    messages: Message[];
  };
}

interface Conversation {
  id: number;
  name: string;
  image: string;
}

const Dashboard = () => {
  const apiBase = "/";
  const token = localStorage.getItem("token") || "";
  const [userData, setUserData] = useState<CurrentUser | null>(null);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showConversationMenu, setShowConversationMenu] = useState(false);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convoId, setConvoId] = useState(-1); // Convo Id = -1 === No Conversation Selected
  const [conversationName, setConversationName] = useState("");
  const [conversationImage, setConversationImage] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const messages = useSelector(
    (state: MessageState) => state.messages.messages
  );
  const [currentMessage, setCurrentMessage] = useState(-1);
  const [showDeleteMessagePrompt, setShowDeleteMessagePrompt] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileUser, setProfileUser] = useState("");
  const [profileNick, setProfileNick] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [friendRequestInput, setFriendRequestInput] = useState("");
  const [currentTab, setCurrentTab] = useState("Direct Messages");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Fetches data for user
  const fetchUserData = useCallback(
    async function fetchUserData() {
      try {
        const response = await fetch(apiBase + "user", {
          method: "GET",
          headers: {
            Authorization: token,
          },
        });

        const apiData = await response.json();

        if (apiData) {
          setUserData(apiData);
        } else {
          navigate("/");
        }
      } catch (err) {
        console.error(err);
      }
    },
    [token, navigate]
  );

  // Fetches all conversations for a user
  const fetchConversations = useCallback(
    async function fetchConversations() {
      try {
        const response = await fetch(apiBase + "conversations", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        });

        const apiData = await response.json();

        setConversations(apiData);
      } catch (err) {
        console.error(err);
      }
    },
    [token]
  );

  const fetchMessages = useCallback(
    async function fetchMessages(currentConversation: number) {
      try {
        const response = await fetch(
          apiBase + "messages/" + currentConversation,
          {
            method: "GET",
            headers: {
              Authorization: token,
            },
          }
        );

        const apiData = await response.json();

        if (response.ok) {
          fetchUserData();
          dispatch(setMessages(apiData));
        } else {
          navigate("/");
        }
      } catch (err) {
        console.error(err);
      }
    },
    [dispatch, navigate, fetchUserData, token]
  );

  // Sends message from current user to conversation
  async function sendMessage() {
    try {
      const response = await fetch(apiBase + "messages/" + convoId, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          messageContent: messageInput,
        }),
      });

      const apiData = await response.json();

      if (response.ok) {
        socket.emit("new_message", token, convoId);
        fetchMessages(convoId);
      } else {
        alert(apiData.message);
      }

      if (!apiData) {
        alert("Something went wrong while sending your message.");
      }

      fetchMessages(convoId);
    } catch (err) {
      console.error(err);
    }
  }

  // Creates a friend request
  async function createFriendRequest(userToAdd: string) {
    try {
      const response = await fetch(apiBase + "user/sendFriendRequest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          userToAdd,
        }),
      });

      const apiData = await response.json();

      if (response.ok) {
        socket.emit("friends_updated", token, userToAdd);
        fetchUserData();
      } else {
        alert(apiData.message);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Establish websocket connection, fetch user data, and fetch the conversations they are a part of
  useEffect(() => {
    socket.emit("register", token);
    fetchUserData();
    fetchConversations();
  }, [token, fetchUserData, fetchConversations]);

  // Listen on each socket event
  useEffect(() => {
    if (!token) {
      return console.log(
        "Web socket initialization failed. No token provided."
      );
    }

    socket.on("new_conversation", () => {
      fetchConversations();
    });

    socket.on("new_message", () => {
      fetchMessages(convoId);
    });

    socket.on("friends_updated", () => {
      fetchUserData();
    });

    socket.on("error", (err) => {
      console.error(err);
    });

    // Remove each socket listener
    return () => {
      socket.off("error");
      socket.off("new_message");
      socket.off("new_conversation");
      socket.off("friends_updated");
    };
  }, [convoId, fetchConversations, fetchMessages, fetchUserData, token]);

  return (
    <div className="flex relative max-w-full min-h-[40rem] h-screen">
      {/* Shell for the entire dashboard */}
      <SideNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userData={userData}
        setShowProfileEditor={setShowProfileEditor}
      ></SideNav>
      <DirectMessagesTab
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        fetchConversations={fetchConversations}
        convoId={convoId}
        setConvoId={setConvoId}
        setShowConversationMenu={setShowConversationMenu}
        conversations={conversations}
        setConversationName={setConversationName}
        setConversationImage={setConversationImage}
        fetchMessages={fetchMessages}
      ></DirectMessagesTab>
      <div className="flex flex-col items-center flex-1 relative max-w-full px-0 bg-slate-800 overflow-hidden">
        {convoId === -1 ? (
          <FriendTab
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            fetchUserData={fetchUserData}
            userData={userData}
            setShowConversationMenu={setShowConversationMenu}
            setRecipients={setRecipients}
            setProfileUser={setProfileUser}
            setProfileNick={setProfileNick}
            setProfileAvatar={setProfileAvatar}
            setProfileBio={setProfileBio}
            setShowProfile={setShowProfile}
          ></FriendTab>
        ) : (
          <ConversationTab
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            convoId={convoId}
            setConvoId={setConvoId}
            conversationName={conversationName}
            conversationImage={conversationImage}
            messages={messages}
            userData={userData}
            setShowProfileEditor={setShowProfileEditor}
            setProfileUser={setProfileUser}
            setProfileNick={setProfileNick}
            setProfileAvatar={setProfileAvatar}
            setProfileBio={setProfileBio}
            setShowProfile={setShowProfile}
            fetchConversations={fetchConversations}
            setShowDeleteMessagePrompt={setShowDeleteMessagePrompt}
            setCurrentMessage={setCurrentMessage}
          ></ConversationTab>
        )}
        {convoId !== -1 ? (
          <form
            className="flex items-center absolute bottom-0 w-full h-20 px-3 bg-slate-950"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
              e.currentTarget.reset();
            }}
          >
            <input
              className="w-full h-10 px-4 bg-slate-900 rounded-full outline-none text-lg text-neutral-300 font-bold font-mono"
              placeholder="Send a Message"
              onChange={(e) => {
                setMessageInput(e.target.value);
              }}
            ></input>
          </form>
        ) : (
          <form
            className="flex items-center absolute bottom-0 w-full h-20 px-3 bg-slate-950"
            onSubmit={(e) => {
              e.preventDefault();
              createFriendRequest(friendRequestInput);
              e.currentTarget.reset();
            }}
          >
            <input
              className="w-full h-10 px-4 bg-slate-900 rounded-full outline-none text-lg text-neutral-300 font-bold font-mono"
              type="text"
              placeholder="Send a Friend Request"
              onChange={(e) => {
                setFriendRequestInput(e.target.value);
              }}
            ></input>
          </form>
        )}
      </div>
      {showProfile ? (
        <ProfileDisplay
          userData={userData}
          setShowProfileEditor={setShowProfileEditor}
          setShowProfile={setShowProfile}
          profileNick={profileNick}
          profileUser={profileUser}
          profileAvatar={profileAvatar}
          setRecipients={setRecipients}
          setShowConversationMenu={setShowConversationMenu}
          createFriendRequest={createFriendRequest}
          profileBio={profileBio}
        ></ProfileDisplay>
      ) : null}
      {showConversationMenu ? (
        <ConversationMenu
          recipients={recipients}
          fetchConversations={fetchConversations}
          setShowConversationMenu={setShowConversationMenu}
          setRecipients={setRecipients}
        ></ConversationMenu>
      ) : null}
      {showProfileEditor ? (
        <ProfileEditor
          fetchUserData={fetchUserData}
          userData={userData}
          showProfileEditor={showProfileEditor}
          setShowProfileEditor={setShowProfileEditor}
        ></ProfileEditor>
      ) : null}
      {showDeleteMessagePrompt ? (
        <DeleteMessagePrompt
          setShowDeleteMessagePrompt={setShowDeleteMessagePrompt}
          convoId={convoId}
          currentMessage={currentMessage}
          fetchMessages={fetchMessages}
        ></DeleteMessagePrompt>
      ) : null}
    </div>
  );
};

export default Dashboard;