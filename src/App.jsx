import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Comanda from "./pages/Comanda";
import Cozinha from "./pages/Cozinha";
import Login from "./pages/Login";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/comanda/:mesaId" element={<Comanda />} />
        <Route path="/cozinha" element={<Cozinha />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;