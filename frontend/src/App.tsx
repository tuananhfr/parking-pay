import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PaymentPage from './PaymentPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/pay/:lockId" element={<PaymentPage />} />
        <Route path="/" element={
          <div className="container min-vh-100 d-flex align-items-center justify-content-center">
            <div className="text-center">
              <i className="bi bi-p-circle text-primary" style={{ fontSize: '5rem' }}></i>
              <h1 className="mt-3">Parking Payment</h1>
              <p className="text-muted">Quét mã QR trên bãi xe để thanh toán</p>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
