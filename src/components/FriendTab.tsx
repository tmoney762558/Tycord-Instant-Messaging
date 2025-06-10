import { useState } from "react";
import { BiMessageAdd } from "react-icons/bi";
import { CiCircleCheck, CiNoWaitingSign } from "react-icons/ci";
import { FaUserFriends } from "react-icons/fa";
import { IoArrowBackCircle, IoPersonRemove } from "react-icons/io5";
import defaultPFP from "../assets/defaultPFP.jpg";
import { IoMdPersonAdd } from "react-icons/io";
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

interface FriendRequest {
  username: string;
  nickname: string;
  avatar: string;
  bio: string;
}

const FriendTab = ({
  currentTab,
  setCurrentTab,
  fetchUserData,
  userData,
  setShowConversationMenu,
  setRecipients,
  setProfileUser,
  setProfileNick,
  setProfileAvatar,
  setProfileBio,
  setShowProfile,
}: {
  currentTab: string;
  setCurrentTab: React.Dispatch<React.SetStateAction<string>>;
  fetchUserData: () => Promise<void>;
  userData: CurrentUser | null;
  setShowConversationMenu: React.Dispatch<React.SetStateAction<boolean>>;
  setRecipients: React.Dispatch<React.SetStateAction<string[]>>;
  setProfileUser: React.Dispatch<React.SetStateAction<string>>;
  setProfileNick: React.Dispatch<React.SetStateAction<string>>;
  setProfileAvatar: React.Dispatch<React.SetStateAction<string>>;
  setProfileBio: React.Dispatch<React.SetStateAction<string>>;
  setShowProfile: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const token = localStorage.getItem("token") || "";
  const apiBase = "/";
  const [currentFriendTab, setCurrentFriendTab] = useState("Friends");

  // Remove a friend
  async function removeFriend(userToUnfriend: string) {
    try {
      const response = await fetch(apiBase + "user/unfriend", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          userToUnfriend: userToUnfriend,
        }),
      });

      const apiData = await response.json();

      if (response.ok) {
        socket.emit("friends_updated", token, userToUnfriend);
        fetchUserData();
      } else {
        alert(apiData.message);
      }
    } catch (err) {
      console.log(err);
    }
  }

  // Accepts a friend request
  async function acceptFriendRequest(requestingUser: string) {
    try {
      const response = await fetch(apiBase + "user/acceptRequest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          requestingUser,
        }),
      });

      const apiData = await response.json();

      if (response.ok) {
        socket.emit("friends_updated", token, requestingUser);
        fetchUserData();
      } else {
        alert(apiData.message);
      }
    } catch (err) {
      console.log(err);
    }
  }

  // Decline a friend request
  async function declineFriendRequest(userToDecline: string) {
    try {
      const response = await fetch(apiBase + "user/declineRequest", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          userToDecline: userToDecline,
        }),
      });

      const apiData = await response.json();

      if (response.ok) {
        socket.emit("friends_updated", token, userToDecline);
        fetchUserData();
      } else {
        alert(apiData.message);
      }
    } catch (err) {
      console.log(err);
    }
  }

  // Cancel a friend request
  async function cancelFriendRequest(userToCancel: string) {
    try {
      const response = await fetch(apiBase + "user/cancelRequest", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          userToCancel: userToCancel,
        }),
      });

      const apiData = await response.json();

      if (response.ok) {
        socket.emit("friends_updated", token, userToCancel);
        fetchUserData();
      } else {
        alert(apiData.message);
      }
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div
      className={`${
        currentTab === "Friends" ? "block" : "lg:block hidden"
      } w-full`}
    >
      <div className="flex sm:justify-center justify-start items-center lg:gap-[5rem] gap-7 w-full py-3 px-2 bg-slate-950">
        <div
          className={`flex justify-center items-center w-24 py-2 bg-slate-900 border-2 ${
            currentFriendTab === "Friends"
              ? "border-white shadow-sm shadow-white"
              : "border-transparent"
          } rounded-full cursor-pointer`}
          onClick={() => {
            setCurrentFriendTab("Friends");
          }}
        >
          <FaUserFriends fontSize={"1.3rem"} fill="white"></FaUserFriends>
        </div>
        <div
          className={`flex justify-center items-center w-24 gap-1 py-2 bg-slate-900 border-2 ${
            currentFriendTab === "Friend Requests"
              ? "border-white shadow-sm shadow-white"
              : "border-transparent"
          } rounded-full cursor-pointer`}
          onClick={() => {
            setCurrentFriendTab("Friend Requests");
          }}
        >
          <IoMdPersonAdd fontSize={"1.3rem"} fill="white"></IoMdPersonAdd>
          <div className="flex justify-center items-center w-7 aspect-square bg-red-400 border-2 border-white rounded-full">
            <p className="text-white">
              {userData
                ? userData?.friendRequests.length +
                  userData?.friendRequestsSent.length
                : 0}
            </p>
          </div>
        </div>
        <div
          className="lg:hidden block absolute right-3 bg-white rounded-full"
          onClick={() => {
            setCurrentTab("Direct Messages");
          }}
        >
          <IoArrowBackCircle
            fontSize={"2rem"}
            fill="oklch(0.704 0.191 22.216)"
          ></IoArrowBackCircle>
        </div>
      </div>
      <div className="flex flex-col items-center w-full mt-5 px-4">
        <h1
          className={`w-2/3 py-2 ${
            currentFriendTab === "Friends" ? "bg-blue-400" : "bg-red-400"
          } rounded-full text-center text-lg text-white font-bold font-mono shadow-md shadow-black`}
        >
          {currentFriendTab}
        </h1>
        {currentFriendTab === "Friends" ? (
          userData?.friends.map((friend, index) => (
            <div
              className="flex items-center justify-between w-full mt-7 px-5 py-3 bg-slate-950 rounded-lg"
              key={index}
            >
              <div className="flex items-center gap-3 cursor-pointer">
                <img
                  className="w-10 aspect-square bg-white rounded-full"
                  src={friend.avatar ? friend.avatar : defaultPFP}
                  onClick={() => {
                    setProfileUser(friend.username);
                    setProfileNick(friend.nickname);
                    setProfileAvatar(friend.avatar);
                    setProfileBio(friend.bio);
                    setShowProfile(true);
                  }}
                ></img>
                <p className="text-xl text-white font-mono">
                  {friend.username}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <BiMessageAdd
                  className="cursor-pointer"
                  fontSize={"1.5rem"}
                  fill="green"
                  onClick={() => {
                    setRecipients([friend.username]);
                    setShowConversationMenu(true);
                  }}
                ></BiMessageAdd>
                <IoPersonRemove
                  className="cursor-pointer"
                  fontSize={"1.3rem"}
                  fill="red"
                  onClick={() => {
                    removeFriend(friend.username);
                  }}
                ></IoPersonRemove>
              </div>
            </div>
          ))
        ) : (
          <div className="w-full mt-7">
            <div className="w-full mt-3">
              <div className="flex flex-col justify-center items-center w-full rounded-lg">
                <h2 className="w-full py-3 bg-slate-900 shadow-lg shadow-black text-center text-xl text-white font-bold">
                  Incoming Requests - {userData?.friendRequests.length || 0}
                </h2>
              </div>
              {userData?.friendRequests.map((request, index) => (
                <div
                  className="flex items-center justify-between w-full mt-3 px-5 py-3 bg-slate-950 rounded-lg"
                  key={index}
                >
                  <div className="flex items-center gap-3 cursor-pointer">
                    <img
                      className="w-10 aspect-square rounded-full"
                      src={request.avatar ? request.avatar : defaultPFP}
                      onClick={() => {
                        setProfileUser(request.username);
                        setProfileNick(request.nickname);
                        setProfileAvatar(request.avatar);
                        setProfileBio(request.bio);
                        setShowProfile(true);
                      }}
                    ></img>
                    <p className="text-xl text-white font-mono">
                      {request.username}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <CiCircleCheck
                      className="cursor-pointer"
                      fontSize={"2rem"}
                      fill="green"
                      onClick={() => {
                        acceptFriendRequest(request.username);
                      }}
                    ></CiCircleCheck>
                    <CiNoWaitingSign
                      className="cursor-pointer"
                      fontSize={"2rem"}
                      fill="red"
                      onClick={() => {
                        declineFriendRequest(request.username);
                      }}
                    ></CiNoWaitingSign>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col justify-center items-center w-full mt-5 rounded-lg">
              <h2 className="w-full py-3 bg-slate-900 shadow-lg shadow-black text-center text-xl text-white font-bold">
                Outgoing Requests - {userData?.friendRequestsSent.length || 0}
              </h2>
              {userData?.friendRequestsSent.map((request, index) => (
                <div
                  className="flex items-center justify-between w-full mt-3 px-5 py-3 bg-slate-950 rounded-lg"
                  key={index}
                >
                  <div className="flex items-center gap-3 cursor-pointer">
                    <img
                      className="w-10 aspect-square rounded-full"
                      src={request.avatar ? request.avatar : defaultPFP}
                      onClick={() => {
                        setProfileUser(request.username);
                        setProfileNick(request.nickname);
                        setProfileAvatar(request.avatar);
                        setProfileBio(request.bio);
                        setShowProfile(true);
                      }}
                    ></img>
                    <p className="text-xl text-white font-mono">
                      {request.username}
                    </p>
                  </div>
                  <CiNoWaitingSign
                    className="cursor-pointer"
                    fontSize={"2rem"}
                    fill="red"
                    onClick={() => {
                      cancelFriendRequest(request.username);
                    }}
                  ></CiNoWaitingSign>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendTab;
