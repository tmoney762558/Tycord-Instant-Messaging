import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const Login = () => {
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const apiBase = "/auth/login";

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
      <h1 className="lg:block hidden absolute top-2 left-5 text-2xl text-neutral-300 font-bold">Tycord</h1>
      <form
        className="flex flex-col gap-5 w-full max-w-[30rem] py-7 px-10 border-2 border-slate-700 rounded-sm shadow-lg"
        onSubmit={(e) => {
          e.preventDefault();
          userSignIn();
        }}
      >
        <label className="w-full text-center text-4xl text-neutral-300 font-mono font-bold">
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
        <NavLink
          className="w-fit border-b-2 border-transparent hover:border-red-300 text-red-300 font-bold cursor-pointer"
          to={"/signUp"}
        >
          Don't have an account? Sign up!
        </NavLink>
      </form>
    </div>
  );
};

export default Login;
