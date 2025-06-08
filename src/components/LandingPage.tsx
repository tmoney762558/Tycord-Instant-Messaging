import { NavLink } from "react-router-dom";
import chatHero from "../assets/chathero.png";
import { useState } from "react";
import { CiMenuFries } from "react-icons/ci";

const LandingPage = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="flex justify-center w-full min-h-screen gradient-background noto-san overflow-y-auto">
      <div className="flex flex-col justify-center items-center w-full max-w-[100rem] pb-[3rem] lg:px-[2.5rem] px-[1.5rem]">
        <nav className="flex lg:justify-between justify-end gap-3 w-full py-5">
          <h3 className="lg:block hidden text-2xl text-white font-bold">
            Tycord
          </h3>
          <div className="lg:hidden block relative">
            <CiMenuFries
              className="cursor-pointer"
              fontSize={"1.5rem"}
              fill="white"
              onClick={() => {
                setDropdownOpen(!dropdownOpen);
              }}
            ></CiMenuFries>
            {dropdownOpen ? (
              <div className="absolute top-7 right-0">
                <NavLink to="/signup">
                  <button className="w-20 py-1 bg-transparent border-2 border-neutral-300 text-sm text-white font-bold cursor-pointer">
                    Sign Up
                  </button>
                </NavLink>
                <NavLink to="/login">
                  <button className="w-20 px-3 py-1 bg-red-400 border-2 border-neutral-300 text-sm text-white font-bold cursor-pointer">
                    Sign In
                  </button>
                </NavLink>
              </div>
            ) : null}
          </div>
          <div className="lg:flex hidden gap-5">
            <NavLink to="/signup">
              <button className="lg:px-7 px-3 lg:py-[0.3rem] py-1 bg-transparent border-2 border-neutral-300 rounded-full text-white font-bold cursor-pointer">
                Sign Up
              </button>
            </NavLink>
            <NavLink to="/login">
              <button className="lg:px-7 px-3 lg:py-[0.3rem] py-1 bg-red-400 border-2 border-neutral-300 rounded-full text-white font-bold cursor-pointer">
                Sign In
              </button>
            </NavLink>
          </div>
        </nav>
        <div className="flex w-full h-full lg:mt-0 mt-[5rem]">
          <div className="flex lg:flex-row flex-col justify-between items-center gap-10 w-full">
            <div className="lg:w-1/2 w-full lg:text-left text-center">
              <h1 className="lg:text-7xl text-5xl text-blue-200 font-bold">
                Tycord
              </h1>
              <h2 className="mt-7 lg:text-6xl text-4xl text-white font-bold">
                Where conversations come to life. Chat with us today.
              </h2>
              <NavLink to="/signup">
                <button className="w-[10rem] mt-10 py-2 bg-white hover:bg-black rounded-full text-xl hover:text-white font-bold cursor-pointer">
                  Get Started
                </button>
              </NavLink>
            </div>
            <img
              className="lg:w-[30%] w-1/2 max-w-[25rem]"
              src={chatHero}
            ></img>
          </div>
        </div>
        <div className="lg:flex hidden justify-between w-full text-2xl text-white font-bold">
          <p className="py-3 px-10 border-2 border-white rounded-full">Chat With Friends</p>
          <p className="py-3 px-10 border-2 border-white rounded-full">Instant Messaging</p>
          <p className="py-3 px-10 border-2 border-white rounded-full">Secure Chat Rooms</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
