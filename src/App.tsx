import { Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import Dashboard from "./components/Dashboard";
import LandingPage from "./components/LandingPage";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard></Dashboard>}></Route>
      <Route path="/login" element={<Login></Login>}></Route>
      <Route path="/signUp" element={<SignUp></SignUp>}></Route>
      <Route path="/dashboard" element={<Dashboard></Dashboard>}></Route>
    </Routes>
  );
};

export default App;
