import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Pedido from "./pages/Pedido";
import Cozinha from "./pages/Cozinha";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pedido/:mesaId" element={<Pedido />} />
        <Route path="/cozinha" element={<Cozinha />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;