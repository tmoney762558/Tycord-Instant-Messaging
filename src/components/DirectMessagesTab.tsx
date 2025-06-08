import { FaMessage } from "react-icons/fa6";
import Conversation from "./Conversation";
import { socket } from "../socket.ts";

interface Conversation {
  id: number;
  name: string;
  image: string;
}

const DirectMessagesTab = ({
  currentTab,
  setCurrentTab,
  fetchConversations,
  convoId,
  setConvoId,
  setShowConversationMenu,
  conversations,
  setConversationName,
  setConversationImage,
  fetchMessages,
}: {
  currentTab: string;
  setCurrentTab: React.Dispatch<React.SetStateAction<string>>;
  fetchConversations: () => Promise<void>;
  convoId: number;
  setConvoId: React.Dispatch<React.SetStateAction<number>>;
  setShowConversationMenu: React.Dispatch<React.SetStateAction<boolean>>;
  conversations: Conversation[];
  setConversationName: React.Dispatch<React.SetStateAction<string>>;
  setConversationImage: React.Dispatch<React.SetStateAction<string>>;
  fetchMessages: (currentConversation: number) => Promise<void>;
}) => {
  const token = localStorage.getItem("token") || "";

  return (
    <div
      className={`${
        currentTab === "Direct Messages" ? "flex" : "lg:flex hidden"
      } flex-col items-center lg:shrink-0 bg-slate-900 w-full lg:max-w-[30rem] max-w-full h-full px-5 overflow-y-auto`}
    >
      <div className="flex lg:flex-row flex-col justify-center items-center gap-3 w-full py-4">
        <h1
          className=" text-xl text-white font-mono font-bold"
          onClick={fetchConversations}
        >
          Direct Messages
        </h1>
        <FaMessage fontSize={"1.3rem"} fill="white"></FaMessage>
      </div>
      <button
        className="w-full mt-5 py-2 bg-blue-400 rounded-lg text-white font-bold font-mono shadow-lg shadow-black cursor-pointer"
        onClick={() => {
          socket.emit("closed_conversation", token, convoId);
          setConvoId(-1);
          setCurrentTab("Friends");
        }}
      >
        Friends
      </button>
      <button
        className="w-full mt-3 py-2 bg-red-400 rounded-lg text-white font-bold font-mono shadow-lg shadow-black cursor-pointer"
        onClick={() => {
          setShowConversationMenu(true);
        }}
      >
        Create Conversation
      </button>
      <ul className="flex flex-col items-center gap-2 w-full mt-7 pb-5 overflow-y-auto">
        {conversations.map((conversation, index) => {
          return (
            <div
              key={index}
              className="w-full"
              onClick={(e) => {
                if (e.currentTarget) {
                  if (convoId !== -1) {
                    socket.emit("closed_conversation", token, convoId);
                  }
                  socket.emit("join_conversation", token, conversation.id);
                  setConvoId(conversation.id);
                  setCurrentTab("Conversation");
                  setConversationName(conversation.name);
                  setConversationImage(conversation.image);
                  fetchMessages(conversation.id);
                }
              }}
            >
              <Conversation
                name={conversation.name}
                image={conversation.image}
              ></Conversation>
            </div>
          );
        })}
      </ul>
    </div>
  );
};

export default DirectMessagesTab;
