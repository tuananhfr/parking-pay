import { BrowserRouter, Routes, Route } from "react-router-dom";
import PaymentPage from "./PaymentPage";
import PosSearch from "./pages/PosSearch";
import PosPayment from "./pages/PosPayment";
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
        <Route path="/pos/result/:lockId" element={<PosResult />} />

        {/* Home - Redirect to POS Search */}
        <Route
          path="/"
          element={
            <div className="container min-vh-100 d-flex align-items-center justify-content-center">
              <div className="text-center">
                <i
                  className="bi bi-p-circle text-primary"
                  style={{ fontSize: "5rem" }}
                ></i>
                <h1 className="mt-3">Parking Payment</h1>
                <p className="text-muted mb-4">
                  Quét mã QR trên bãi xe để thanh toán
                </p>
                <div className="d-flex gap-2 justify-content-center">
                  <a href="/pos/search" className="btn btn-primary">
                    <i className="bi bi-cash-register me-2"></i>
                    POS - Thanh toán
                  </a>
                </div>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
