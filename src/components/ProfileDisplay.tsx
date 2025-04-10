import { useState } from "react";
import { IoIosClose } from "react-icons/io";
import { IoChatbubble, IoPersonAdd } from "react-icons/io5";
import defaultPFP from "../assets/defaultPFP.jpg";

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

const ProfileDisplay = ({
  userData,
  setShowProfileEditor,
  setShowProfile,
  profileNick,
  profileUser,
  setRecipients,
  setShowConversationMenu,
  createFriendRequest,
  profileBio,
  profileAvatar,
}: {
  userData: CurrentUser | null;
  setShowProfileEditor: React.Dispatch<React.SetStateAction<boolean>>;
  setShowProfile: React.Dispatch<React.SetStateAction<boolean>>;
  profileNick: string;
  profileUser: string;
  setRecipients: React.Dispatch<React.SetStateAction<string[]>>;
  setShowConversationMenu: React.Dispatch<React.SetStateAction<boolean>>;
  createFriendRequest: (userToAdd: string) => Promise<void>;
  profileBio: string;
  profileAvatar: string;
}) => {
  const [currentProfileTab, setCurrentProfileTab] = useState("Bio");
  return (
    <div className="flex justify-center items-center absolute inset-0 w-screen h-screen bg-[rgba(0, 0, 0, 0.10)] backdrop-blur-sm z-10 cursor-auto">
      <div className="flex flex-col w-[37rem] h-[35rem] p-5 bg-slate-900 rounded-lg shadow-lg shadow-black">
        <div className="flex justify-end w-full py-3">
          <div
            className="bg-white rounded-full shadow-md shadow-black cursor-pointer"
            onClick={() => {
              setShowProfile(false);
            }}
          >
            <IoIosClose
              className="cursor-pointer"
              fontSize={"1.6rem"}
              fill="black"
            ></IoIosClose>
          </div>
        </div>
        <div className="flex flex-col w-full">
          <img
            className="w-[7.5rem] aspect-square border-6 border-black rounded-full shadow-sm shadow-black"
            src={profileAvatar ? profileAvatar : defaultPFP}
          ></img>
          <div className="flex justify-between items-center w-full mt-5">
            <div className="ml-2">
              <p className="text-xl text-white font-mono">{profileNick}</p>
              <p className="text-sm text-neutral-400 font-mono">
                {profileUser}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="flex justify-center items-center w-7 aspect-square rounded-sm bg-blue-400 cursor-pointer"
                onClick={() => {
                  setRecipients([profileUser]);
                  setShowConversationMenu(true);
                }}
              >
                <IoChatbubble fill="white"></IoChatbubble>
              </div>
              {userData &&
              userData?.friends.find(
                (friend) => friend.username === profileUser
              ) ? null : (
                <button
                  className="flex justify-center gap-3 items-center w-[9rem] h-7 bg-red-400 rounded-md text-sm text-white font-mono cursor-pointer"
                  onClick={() => {
                    if (userData && profileUser === userData.username) {
                      setShowProfileEditor(true);
                    } else {
                      createFriendRequest(profileUser);
                    }
                  }}
                >
                  <p>Add Friend</p>
                  <IoPersonAdd></IoPersonAdd>
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 mt-3 bg-slate-950 rounded-lg">
          <ul className="flex items-center gap-5 w-full px-5 pt-5 pb-3">
            <li
              className="border-b-2 border-transparent hover:border-white text-white font-bold cursor-pointer"
              onClick={() => {
                setCurrentProfileTab("Bio");
              }}
            >
              Bio
            </li>
          </ul>
          <div className="w-full px-5">
            <div className="w-full h-[0.1rem] bg-neutral-800">
              {currentProfileTab === "Bio" ? (
                <div className="pt-3">
                  <p className="text-white">{profileBio}</p>
                </div>
              ) : currentProfileTab === "Mutual Friends" ? (
                <div className="pt-3"></div>
              ) : currentProfileTab === "Mutual Servers" ? (
                <div className="pt-3"></div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDisplay;
