import { BrowserRouter, Routes, Route } from "react-router-dom";
import PaymentPage from "./PaymentPage";
import PosSearch from "./pages/PosSearch";
import PosPayment from "./pages/PosPayment";
import PosQrCode from "./pages/PosQrCode";
import PosResult from "./pages/PosResult";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* QR Payment Routes */}
        <Route path="/pay/:lockId" element={<PaymentPage />} />

        {/* POS Routes */}
        <Route path="/pos/search" element={<PosSearch />} />
        <Route path="/pos/payment/:lockId" element={<PosPayment />} />
        <Route path="/pos/payment/:lockId/qr" element={<PosQrCode />} />
        <Route path="/pos/result/:lockId" element={<PosResult />} />

        {/* Home - POS Search */}
        <Route path="/" element={<PosSearch />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
