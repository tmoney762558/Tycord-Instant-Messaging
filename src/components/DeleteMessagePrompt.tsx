import { socket } from "../socket";

const DeleteMessagePrompt = ({
  setShowDeleteMessagePrompt,
  convoId,
  currentMessage,
  fetchMessages,
}: {
  setShowDeleteMessagePrompt: React.Dispatch<React.SetStateAction<boolean>>;
  convoId: number;
  currentMessage: number;
  fetchMessages: (currentConversation: number) => Promise<void>;
}) => {
  const apiBase = "/";
  const token = localStorage.getItem("token") || "";

  async function deleteMessage(messageId: number) {
    try {
      const response = await fetch(apiBase + "messages/" + convoId, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          messageId: messageId,
        }),
      });

      if (response.ok) {
        fetchMessages(convoId);
      } else {
        const apiData = await response.json();
        alert(apiData.message);
      }
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div className="flex justify-center items-center absolute left-0 top-0 w-screen h-screen px-5 bg-[rgba(0, 0, 0, 0.10)] backdrop-blur-sm z-10 cursor-auto">
      <div className="flex flex-col justify-center items-center w-full max-w-[30rem] aspect-[2/1.8] p-5 bg-slate-900 rounded-lg shadow-lg shadow-black">
        <label className="flex justify-center w-2/3 text-center text-xl text-white font-bold">
          Are you sure you want to delete this message?
        </label>
        <div className="flex justify-center gap-5 w-full mt-10">
          <button
            className="w-1/3 h-10 bg-red-400 rounded-sm shadow-lg shadow-black text-lg text-white font-bold cursor-pointer"
            onClick={() => {
              setShowDeleteMessagePrompt(false);
            }}
          >
            Cancel
          </button>
          <button
            className="w-1/3 h-10 bg-blue-400 rounded-sm shadow-lg shadow-black text-lg text-white font-bold cursor-pointer"
            onClick={() => {
              socket.emit("new_message", token, convoId);
              deleteMessage(currentMessage);
              setShowDeleteMessagePrompt(false);
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMessagePrompt;
