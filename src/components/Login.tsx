import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const Login = () => {
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const apiBase = "/";

  const navigate = useNavigate();

  async function userSignIn() {
    try {
      const response = await fetch(apiBase, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailInput,
          password: passwordInput,
        }),
      });

      const apiData = await response.json();

      if (apiData.message) {
        return alert(apiData.message);
      }

      if (apiData.token) {
        localStorage.setItem("token", apiData.token);
        navigate("/dashboard");
      }

    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div className="flex w-full min-h-screen justify-center items-center bg-slate-900 px-3">
      <form
        className="flex flex-col gap-5 w-full max-w-[20rem]"
        onSubmit={(e) => {
          e.preventDefault();
          userSignIn();
        }}
      >
        <label className="w-full text-center text-2xl text-neutral-300 font-mono font-bold">
          Login
        </label>
        <input
          className="w-full h-10 px-4 bg-zinc-900 rounded-sm outline-none text-neutral-300"
          placeholder="Email"
          type="email"
          onChange={(e) => {
            setEmailInput(e.target.value);
          }}
        ></input>
        <input
          className="w-full h-10 px-4 bg-zinc-900 rounded-sm outline-none text-neutral-300"
          placeholder="Password"
          type="password"
          onChange={(e) => {
            setPasswordInput(e.target.value);
          }}
        ></input>
        <button className="w-full h-10 bg-red-400 rounded-sm text-white font-bold">
          Sign In
        </button>
        <NavLink className="text-red-300 cursor-pointer" to={"/signUp"}>Don't have an account? Sign up!</NavLink>
      </form>
    </div>
  );
};

export default Login;
