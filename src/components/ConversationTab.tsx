import { FaTrashCan } from "react-icons/fa6";
import defaultPFP from "../assets/defaultPFP.jpg";
import { IoArrowBackCircle, IoClose } from "react-icons/io5";
import { socket } from "../socket";

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

interface Message {
  id: number;
  createdAt: string;
  content: string;
  username: string;
  nickname: string;
  avatar: string;
  bio: string;
}

interface FriendRequest {
  username: string;
  nickname: string;
  avatar: string;
}

const ConversationTab = ({
  currentTab,
  setCurrentTab,
  userData,
  convoId,
  setConvoId,
  conversationName,
  conversationImage,
  messages,
  setShowProfileEditor,
  setProfileUser,
  setProfileNick,
  setProfileAvatar,
  setProfileBio,
  setShowProfile,
  fetchConversations,
  setShowDeleteMessagePrompt,
  setCurrentMessage,
}: {
  currentTab: string;
  setCurrentTab: React.Dispatch<React.SetStateAction<string>>;
  userData: CurrentUser | null;
  convoId: number;
  setConvoId: React.Dispatch<React.SetStateAction<number>>;
  conversationName: string;
  conversationImage: string;
  messages: Message[];

  setShowProfileEditor: React.Dispatch<React.SetStateAction<boolean>>;
  setProfileUser: React.Dispatch<React.SetStateAction<string>>;
  setProfileNick: React.Dispatch<React.SetStateAction<string>>;
  setProfileAvatar: React.Dispatch<React.SetStateAction<string>>;
  setProfileBio: React.Dispatch<React.SetStateAction<string>>;
  setShowProfile: React.Dispatch<React.SetStateAction<boolean>>;
  fetchConversations: () => Promise<void>;
  setShowDeleteMessagePrompt: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentMessage: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const apiBase = "/";
  const token = localStorage.getItem("token") || "";

  async function leaveConversation(convoId: number) {
    try {
      const response = await fetch(apiBase + "conversations/" + convoId, {
        method: "DELETE",
        headers: {
          Authorization: token,
        },
      });

      const apiData = await response.json();

      if (response.ok) {
        fetchConversations();
      }

      if (apiData.message) {
        return alert(apiData.message);
      }
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div
      className={`${
        currentTab === "Conversation" ? "flex" : "lg:flex hidden"
      } flex-col items-center w-full min-h-[20rem] h-screen`}
    >
      <div className="flex justify-between items-center w-full bg-slate-950 px-5 py-2">
        <div className="flex items-center gap-3">
          <img
            className="w-10 aspect-square rounded-full"
            src={conversationImage}
          ></img>
          <p className="w-full lg:max-w-[20rem] md:max-w-[15rem] max-w-[7.5rem] text-ellipsis text-xl text-white font-mono overflow-x-hidden whitespace-nowrap">
            {conversationName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="p-2 bg-red-400 rounded-sm shadow-lg shadow-black lg:text-normal text-small text-white font-bold cursor-pointer"
            onClick={() => {
              socket.emit("closed_conversation", token, convoId);
              leaveConversation(convoId);
              setConvoId(-1);
              setCurrentTab("Direct Messages");
            }}
          >
            <FaTrashCan></FaTrashCan>
          </button>
          <button
            className="lg:hidden block bg-white rounded-full"
            onClick={() => {
              socket.off("new_message");
              setCurrentTab("Direct Messages");
            }}
          >
            <IoArrowBackCircle
              fontSize={"2rem"}
              fill="oklch(0.704 0.191 22.216)"
            ></IoArrowBackCircle>
          </button>
        </div>
      </div>
      <ul className="flex flex-col gap-3 flex-1 w-full mt-5 mb-[6.5rem] px-5 overflow-y-auto">
        {messages && messages.length
          ? messages.map((message, index) => (
              <li
                className="flex justify-between items-center w-full px-5 py-4 bg-slate-900 rounded-lg list-none break-all"
                key={index}
              >
                <div className="flex items-start gap-3">
                  <img
                    className="w-10 aspect-square rounded-full cursor-pointer"
                    src={message.avatar ? message.avatar : defaultPFP}
                    onError={(e) => {
                      e.currentTarget.src = defaultPFP;
                    }}
                    onClick={() => {
                      if (message.username === userData?.username) {
                        setShowProfileEditor(true);
                      } else {
                        setProfileUser(message.username);
                        setProfileNick(message.nickname);
                        setProfileAvatar(message.avatar);
                        setProfileBio(message.bio);
                        setShowProfile(true);
                      }
                    }}
                  ></img>
                  <div className="w-fit">
                    <p className="text-xl text-white font-mono">
                      {message.nickname}
                    </p>
                    <p className="w-full mt-1 text-md text-white font-mono">
                      {message.content}
                    </p>
                  </div>
                </div>
                {userData && message.username === userData.username ? (
                  <div
                    className="self-start ml-5 p-[0.2rem] bg-red-400 rounded-full cursor-pointer"
                    onClick={() => {
                      setCurrentMessage(message.id);
                      setShowDeleteMessagePrompt(true);
                    }}
                  >
                    <IoClose fontSize={"1.7rem"} fill="white"></IoClose>
                  </div>
                ) : null}
              </li>
            ))
          : null}
      </ul>
    </div>
  );
};

export default ConversationTab;
