import { useRef, useState } from "react";
import { IoIosClose } from "react-icons/io";
import { IoAdd, IoClose } from "react-icons/io5";
import defaultPFP from "../assets/defaultPFP.jpg";

const ConversationMenu = ({
  recipients,
  fetchConversations,
  setShowConversationMenu,
  setRecipients,
}: {
  recipients: string[];
  fetchConversations: () => Promise<void>;
  setShowConversationMenu: React.Dispatch<React.SetStateAction<boolean>>;
  setRecipients: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const apiBase = "/";
  const token = localStorage.getItem("token") || "";
  const [conversationImage, setConversationImage] = useState<File | null>(null);
  const [conversationNameInput, setConversationNameInput] = useState("");
  const recipientInputRef = useRef<HTMLInputElement | null>(null);

  // Creates a conversation
  async function createConversation() {
    try {
      const formData = new FormData();

      if (conversationImage) {
        formData.append("conversationImg", conversationImage);
      }
      if (conversationNameInput) {
        formData.append("conversationName", conversationNameInput);
      }
      if (recipients) {
        formData.append("recipientUsernames", JSON.stringify(recipients));
      }

      const response = await fetch(apiBase + "conversations", {
        method: "POST",
        headers: {
          Authorization: token,
        },
        body: formData,
      });

      const apiData = await response.json();

      if (apiData.message) {
        return alert(apiData.message);
      }

      if (apiData) {
        fetchConversations();
      }
    } catch (err) {
      console.log(err);
    }
  }
  return (
    <div className="flex justify-center items-center absolute inset-0 w-screen h-screen px-5 bg-[rgba(0, 0, 0, 0.10)] backdrop-blur-sm z-10 cursor-auto">
      <form
        className="flex flex-col items-center py-7 lg:px-10 px-5 w-full max-w-[50rem] bg-slate-900 rounded-lg shadow-lg shadow-black"
        onSubmit={(e) => {
          e.preventDefault();
          if (!recipients.length) {
            alert("Please enter at least 1 recipient.");
          }
          createConversation();
          setRecipients([]);
          setShowConversationMenu(false);
        }}
      >
        <div className="flex justify-end w-full">
          <div
            className="lg:mb-0 mb-5 bg-white rounded-full shadow-md shadow-black cursor-pointer"
            onClick={() => {
              setRecipients([]);
              setShowConversationMenu(false);
            }}
          >
            <IoIosClose
              className="cursor-pointer"
              fontSize={"1.6rem"}
              fill="black"
            ></IoIosClose>
          </div>
        </div>
        <label className="text-xl text-neutral-300 font-bold">
          Conversation Image
        </label>
        <img
          className="w-[7.5rem] aspect-square mt-3 border-6 border-black rounded-full shadow-sm shadow-black"
          src={
            conversationImage
              ? URL.createObjectURL(conversationImage)
              : defaultPFP
          }
        ></img>
        <label
          className="mt-5 py-1 px-6 bg-white border-2 border-black rounded-full text-black font-mono shadow-lg shadow-black cursor-pointer"
          htmlFor="imageInput"
        >
          Upload Image
          <input
            id="imageInput"
            className="hidden"
            type="file"
            accept=".png,.jpg,.webp,.gif"
            onChange={(e) => {
              if (e.currentTarget.files) {
                setConversationImage(e.currentTarget.files[0]);
              }
            }}
          ></input>
        </label>
        <label className="w-full mt-3 text-left text-xl text-neutral-300 font-bold">
          Conversation Name
        </label>
        <input
          className="w-full h-10 mt-3 px-4 bg-zinc-900 rounded-l-sm outline-none text-neutral-300"
          type="text"
          placeholder="Conversation Name"
          required
          onChange={(e) => {
            setConversationNameInput(e.target.value);
          }}
        ></input>
        <label className="w-full mt-7 text-left text-xl text-neutral-300 font-bold">
          Recipients
        </label>
        <div className="flex items-center w-full mt-3">
          <input
            className="w-full h-10 px-4 bg-zinc-900 rounded-l-sm outline-none text-neutral-300"
            type="text"
            placeholder="Add Recipients (Username)"
            ref={recipientInputRef}
          ></input>
          <button
            className="flex justify-center items-center shrink-0 w-10 h-10 bg-red-400 rounded-r-sm text-white cursor-pointer"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (recipientInputRef && recipientInputRef.current) {
                setRecipients([...recipients, recipientInputRef.current.value]);
                recipientInputRef.current.value = "";
              }
            }}
          >
            <IoAdd></IoAdd>
          </button>
        </div>
        <div className="flex flex-wrap gap-5 w-full h-10">
          {recipients.map((recipient, index) => (
            <div
              className="flex items-center gap-3 mt-5 py-2 px-5 bg-slate-800 rounded-full text-neutral-300"
              key={index}
            >
              <p>{recipient}</p>
              <IoClose
                className="cursor-pointer"
                onClick={() => {
                  setRecipients([
                    ...recipients.filter(
                      (_recipient, indexToDel) => indexToDel !== index
                    ),
                  ]);
                }}
              ></IoClose>
            </div>
          ))}
        </div>
        <button
          className="lg:w-1/2 w-full h-10 mt-7 bg-red-400 rounded-lg text-lg text-white font-bold shadow-lg shadow-black cursor-pointer"
          type="submit"
        >
          Create Conversation
        </button>
      </form>
    </div>
  );
};

export default ConversationMenu;
