import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [nicknameInput, setNicknameInput] = useState("");

  const apiBase = "http://localhost:3000/auth/register";

  const navigate = useNavigate();

  async function userSignUp() {
    try {
      const response = await fetch(apiBase, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailInput,
          password: passwordInput,
          username: usernameInput,
          nickname: nicknameInput,
        }),
      });

      const apiData = await response.json();

      if (!apiData) {
        alert("Error occured when creating account. Please try again later.");
      }

      console.log(apiData);
      if (apiData.token) {
        console.log("Token retrieved.", apiData.token);
        localStorage.setItem("token", apiData.token);
        navigate("/dashboard");
      }
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div className="flex w-full min-h-screen justify-center items-center bg-slate-900">
      <form
        className="flex flex-col gap-5 w-full max-w-[20rem]"
        onSubmit={(e) => {
          e.preventDefault();
          userSignUp();
        }}
      >
        <label className="w-full text-center text-2xl text-neutral-300 font-mono font-bold">
          Sign Up
        </label>
        <input
          className="w-full h-10 px-4 bg-zinc-900 rounded-sm outline-none text-neutral-300"
          placeholder="Email"
          type="email"
          required
          onChange={(e) => {
            setEmailInput(e.target.value);
          }}
        ></input>
        <input
          className="w-full h-10 px-4 bg-zinc-900 rounded-sm outline-none text-neutral-300"
          placeholder="Password"
          type="password"
          required
          onChange={(e) => {
            setPasswordInput(e.target.value);
          }}
        ></input>
        <input
          className="w-full h-10 px-4 bg-zinc-900 rounded-sm outline-none text-neutral-300"
          placeholder="Username"
          type="text"
          required
          onChange={(e) => {
            setUsernameInput(e.target.value);
          }}
        ></input>
        <input
          className="w-full h-10 px-4 bg-zinc-900 rounded-sm outline-none text-neutral-300"
          placeholder="Nickname"
          type="text"
          required
          onChange={(e) => {
            setNicknameInput(e.target.value);
          }}
        ></input>
        <button className="w-full h-10 bg-red-400 rounded-sm text-white font-bold">
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default SignUp;
