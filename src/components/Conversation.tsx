import { IoChatboxEllipsesSharp } from "react-icons/io5";

const Conversation = ({ name, image }: { name: string, image: string }) => {
  return (
    <li className="flex justify-between items-center w-full px-5 py-3 bg-slate-950 rounded-lg cursor-pointer">
      <div className="flex items-center gap-3">
        <img className="w-10 aspect-square rounded-full" src={image}></img>
        <p className="lg:w-[15rem] w-[7rem] text-xl text-white font-mono overflow-x-hidden whitespace-nowrap text-ellipsis">{name}</p>
      </div>
      <IoChatboxEllipsesSharp
        fontSize={"1.7rem"}
        fill="white"
      ></IoChatboxEllipsesSharp>
    </li>
  );
};

export default Conversation;
