import { useState } from "react";
import { IoIosClose } from "react-icons/io";
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

const ProfileEditor = ({
  fetchUserData,
  userData,
  showProfileEditor,
  setShowProfileEditor,
}: {
  fetchUserData: () => void;
  userData: CurrentUser | null;
  showProfileEditor: boolean;
  setShowProfileEditor: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const apiBase = "/user";
  const token = localStorage.getItem("token") || "";
  const [currentTab, setCurrentTab] = useState("Bio");
  const [editing, setEditing] = useState(false);
  const [usernameInput, setUsernameInput] = useState(userData?.username);
  const [nicknameInput, setNicknameInput] = useState(userData?.nickname);
  const [avatarInput, setAvatarInput] = useState<File | null>(null);
  const [bioInput, setBioInput] = useState(userData?.bio);

  async function editUserData() {
    try {
      const formData = new FormData();

      if (usernameInput) formData.append("newUsername", usernameInput);
      if (nicknameInput) formData.append("newNickname", nicknameInput);
      if (bioInput) formData.append("newBio", bioInput);
      if (avatarInput) formData.append("newAvatar", avatarInput);

      const response = await fetch(apiBase, {
        method: "PUT",
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
        fetchUserData();
      }
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div className="flex justify-center items-center absolute inset-0 w-screen h-screen px-5 bg-[rgba(0, 0, 0, 0.10)] backdrop-blur-sm z-10 cursor-auto">
      {showProfileEditor && !editing ? (
        <div className="flex flex-col w-[37rem] h-[35rem] p-5 bg-slate-900 rounded-lg shadow-lg shadow-black">
          <div className="flex justify-end w-full py-3">
            <div
              className="bg-white rounded-full shadow-md shadow-black cursor-pointer"
              onClick={() => {
                setShowProfileEditor(false);
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
              src={userData && userData.avatar ? userData?.avatar : defaultPFP}
            ></img>
            <div className="flex justify-between items-center w-full mt-5">
              <div className="ml-2">
                <p className="text-xl text-white font-mono">
                  {userData?.nickname}
                </p>
                <p className="text-sm text-neutral-400 font-mono">
                  {userData?.username}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="w-[7rem] h-10 bg-red-400 rounded-sm text-white font-bold cursor-pointer"
                  onClick={() => {
                    setEditing(true);
                  }}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 mt-3 bg-slate-950 rounded-lg">
            <ul className="flex items-center gap-5 w-full px-5 pt-5 pb-3">
              <li
                className="border-b-2 border-transparent hover:border-white text-white font-bold cursor-pointer"
                onClick={() => {
                  setCurrentTab("Bio");
                }}
              >
                Bio
              </li>
            </ul>
            <div className="w-full px-5">
              <div className="w-full h-[0.1rem] bg-neutral-800">
                {currentTab === "Bio" ? (
                  <div className="pt-3">
                    <p className="text-white">{userData?.bio}</p>
                  </div>
                ) : currentTab === "Mutual Friends" ? (
                  <div className="pt-3"></div>
                ) : currentTab === "Mutual Servers" ? (
                  <div className="pt-3"></div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {editing ? (
        <div className="flex flex-col w-full max-w-[50rem] h-[37rem] p-5 bg-slate-900 rounded-lg shadow-lg shadow-black overflow-y-auto">
          <div className="flex justify-end w-full py-3">
            <div
              className="bg-white rounded-full shadow-md shadow-black cursor-pointer"
              onClick={() => {
                setEditing(false);
              }}
            >
              <IoIosClose
                className="cursor-pointer"
                fontSize={"1.6rem"}
                fill="black"
              ></IoIosClose>
            </div>
          </div>
          <form
            className="w-full h-full mt-7"
            onSubmit={(e) => {
              e.preventDefault();
              editUserData();
              setEditing(false);
            }}
          >
            <div className="flex lg:flex-row flex-col lg:justify-start justify-center items-center gap-5">
              <img
                className="w-[7.5rem] aspect-square rounded-full"
                src={
                  avatarInput
                    ? URL.createObjectURL(avatarInput) // Preview the selected file
                    : userData && userData.avatar
                    ? userData.avatar
                    : defaultPFP
                }
              ></img>
              <div className="flex flex-col lg:items-start items-center w-full text-white font-bold">
                <p className="text-lg">{userData?.username}</p>
                <p>{userData?.nickname}</p>
                <label className="block mt-5 py-1 px-3 bg-white border-2 border-black rounded-full text-black font-mono cursor-pointer" htmlFor="avatarInput">
                  Upload Avatar
                <input
                  id="avatarInput"
                  className="hidden"
                  type="file"
                  accept=".png,.jpg,.webp,.gif"
                  onChange={(e) => {
                    if (e.currentTarget.files) {
                      setAvatarInput(e.currentTarget.files[0]);
                    }
                  }}
                ></input>
                </label>
              </div>
            </div>
            <div className="mt-5">
              <label className="w-full text-left text-xl text-white font-bold">
                Username
              </label>
              <input
                className="w-full h-10 mt-3 px-4 bg-slate-950 rounded-lg text-neutral-300 outline-none"
                placeholder="Username"
                defaultValue={userData?.username}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                }}
              ></input>
            </div>
            <div className="mt-3">
              <label className="w-full mt-3 text-left text-xl text-white font-bold">
                Nickname
              </label>
              <input
                className="w-full h-10 mt-3 px-4 bg-slate-950 rounded-lg text-neutral-300 outline-none"
                placeholder="Nickname"
                defaultValue={userData?.nickname}
                onChange={(e) => {
                  setNicknameInput(e.target.value);
                }}
              ></input>
            </div>
            <div className="mt-3">
              <label className="w-full mt-3 text-left text-xl text-white font-bold">
                Bio
              </label>
              <input
                className="w-full h-10 mt-3 px-4 bg-slate-950 rounded-lg text-neutral-300 outline-none"
                placeholder="What's poppin'?"
                defaultValue={userData?.bio}
                onChange={(e) => {
                  setBioInput(e.target.value);
                }}
              ></input>
              <button
                className="w-full h-10 lg:mb-0 mb-5 mt-5 bg-red-400 rounded-sm text-white font-bold cursor-pointer"
                type="submit"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};

export default ProfileEditor;
