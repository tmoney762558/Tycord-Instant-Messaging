import { HiPaperAirplane } from "react-icons/hi2";
import defaultPFP from "../assets/defaultPFP.jpg";
import { BiLogOut } from "react-icons/bi";
import { useNavigate } from "react-router-dom";

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
}

const SideNav = ({
  currentTab,
  setCurrentTab,
  userData,
  setShowProfileEditor,
}: {
  currentTab: string;
  setCurrentTab: React.Dispatch<React.SetStateAction<string>>;
  userData: CurrentUser | null;
  setShowProfileEditor: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const navigate = useNavigate();

  return (
    <nav className={`${currentTab === "Direct Messages" ? "flex" : "md:flex hidden"} flex-col items-center shrink-0 relative lg:p-6 p-2 bg-slate-950`}>
      <button className="p-3 bg-slate-800 hover:bg-red-400 rounded-full cursor-pointer" onClick={() => {
        setCurrentTab("Direct Messages");
      }}>
        <HiPaperAirplane fontSize={"1.7rem"} fill="white"></HiPaperAirplane>
      </button>
      <ul className="flex flex-col items-center gap-5 mt-10">
        <li className="w-10 aspect-square bg-red-400 rounded-full cursor-pointer"></li>
        <li className="w-10 aspect-square bg-green-400 rounded-full cursor-pointer"></li>
        <li className="w-10 aspect-square bg-blue-400 rounded-full cursor-pointer"></li>
        <li className="flex flex-col items-center gap-5 absolute aspect-square bottom-7 rounded-full">
          0{" "}
          <img
            className="w-10 aspect-square rounded-full cursor-pointer"
            src={userData && userData.avatar ? userData.avatar : defaultPFP}
            onClick={() => {
              setShowProfileEditor(true);
            }}
          ></img>
          <BiLogOut
            className="cursor-pointer"
            fontSize={"2rem"}
            fill="white"
            onClick={() => {
              localStorage.setItem("token", "");
              navigate("/");
            }}
          ></BiLogOut>
        </li>
      </ul>
    </nav>
  );
};

export default SideNav;
