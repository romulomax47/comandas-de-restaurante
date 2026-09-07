import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Comanda from "./pages/Comanda";
import Cozinha from "./pages/Cozinha";
import Login from "./pages/Login";
import Caixa from "./pages/Caixa";
import ProdutosAdmin from "./pages/ProdutosAdmin";
import GarconsAdmin from "./pages/GarconsAdmin";
import Admin from "./pages/Admin";
import RotaProtegida from "./components/RotaProtegida";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/comanda/:mesaId" element={<RotaProtegida
          funcoesPermitidas={[
            "garcom",
            "proprietario",
          ]}
        >
          <Comanda />
        </RotaProtegida>} />
        <Route path="/cozinha" element={<Cozinha />} />
        <Route path="/" element={<Login />} />
        <Route path="/caixa" element={<RotaProtegida
          funcoesPermitidas={[
            "caixa",
            "proprietario",
          ]}
        >
          <Caixa />
        </RotaProtegida>} />
        <Route path="/admin/produtos" element={<RotaProtegida
          funcoesPermitidas={["proprietario"]}
        >
          <ProdutosAdmin />
        </RotaProtegida>} />
        <Route path="/admin/garcons" element={<GarconsAdmin />} />
        <Route path="/admin" element={<RotaProtegida
          funcoesPermitidas={["proprietario"]}
        >
          <Admin />
        </RotaProtegida>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;