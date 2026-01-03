import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

interface LockerDetail {
  lock_id: string;
  name: string;
  device_id: string;
  status: string;
  occupied: boolean;
  parking_fee: number;
  hourly_rate: number;
  car_enter_time: string | null;
  lock_free_time: number;
}

function PosQrCode() {
  const { lockId } = useParams<{ lockId: string }>();
  const navigate = useNavigate();
  const [locker, setLocker] = useState<LockerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  useEffect(() => {
    if (lockId) {
      loadLockerDetails();
    }
  }, [lockId]);

  const loadLockerDetails = async () => {
    if (!lockId) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/pos/locker/${lockId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Không tìm thấy locker");
      }

      const data = await response.json();
      setLocker(data.data);
    } catch (err: any) {
      setError(err.message || "Lỗi tải thông tin locker");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!lockId || !locker) return;

    if (
      !confirm(
        `Xác nhận đã chuyển khoản ${locker.parking_fee.toLocaleString(
          "vi-VN"
        )} đ cho locker ${lockId}?\n\nLocker sẽ được mở khóa tự động.`
      )
    ) {
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/pos/confirm-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lock_id: lockId,
          note: "Confirmed via POS",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi xác nhận thanh toán");
      }

      // Navigate to result page
      navigate(`/pos/result/${lockId}?success=true`);
    } catch (err: any) {
      setError(err.message || "Lỗi xác nhận thanh toán");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="pos-container d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div
            className="spinner-border text-primary"
            role="status"
            style={{ width: "3rem", height: "3rem" }}
          >
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-3 text-muted">Đang tải thông tin locker...</p>
        </div>
      </div>
    );
  }

  if (error || !locker) {
    return (
      <div className="pos-container">
        <div className="container-fluid h-100 d-flex align-items-center justify-content-center">
          <div
            className="card shadow-sm border-0"
            style={{ maxWidth: "600px", width: "100%" }}
          >
            <div className="card-body text-center py-5">
              <i
                className="bi bi-exclamation-triangle text-danger"
                style={{ fontSize: "3rem" }}
              ></i>
              <h5 className="mt-3">Lỗi</h5>
              <p className="text-muted">{error || "Không tìm thấy locker"}</p>
              <button className="btn btn-primary" onClick={() => navigate("/")}>
                <i className="bi bi-arrow-left me-2"></i>
                Quay lại tìm kiếm
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pos-container">
      <div
        className="container-fluid h-100 d-flex flex-column px-3 py-3"
        style={{ maxWidth: "100%" }}
      >
        {/* Header - Compact */}
        <div className="text-center mb-3" style={{ flexShrink: 0 }}>
          <h4 className="mb-1 fw-bold" style={{ fontSize: "1.1rem" }}>
            {locker.lock_id} - {locker.name}
          </h4>
          <div className="text-muted" style={{ fontSize: "0.9rem" }}>
            Tổng tiền:{" "}
            <span className="text-success fw-bold">
              {locker.parking_fee.toLocaleString("vi-VN")} đ
            </span>
          </div>
        </div>

        {/* QR Code - Full Screen */}
        <div
          className="flex-grow-1 d-flex align-items-center justify-content-center"
          style={{ minHeight: 0 }}
        >
          <div className="text-center" style={{ width: "100%" }}>
            <img
              src="https://img.vietqr.io/image/vietinbank-113366668888-compact.jpg"
              alt="QR Code thanh toán"
              style={{
                maxWidth: "100%",
                maxHeight: "60vh",
                width: "auto",
                height: "auto",
                borderRadius: "8px",
              }}
            />
            <div className="mt-3 text-muted" style={{ fontSize: "0.85rem" }}>
              Quét mã QR để thanh toán
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="alert alert-danger mb-3"
            role="alert"
            style={{ fontSize: "0.85rem", flexShrink: 0 }}
          >
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {/* Footer Buttons */}
        <div className="mt-3" style={{ flexShrink: 0 }}>
          {/* Confirm Payment Button */}
          <button
            className="btn btn-success btn-lg w-100 py-3 fw-bold mb-2"
            onClick={handleConfirmPayment}
            disabled={processing}
            style={{ fontSize: "1.2rem" }}
          >
            {processing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Đang xử lý...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Đã chuyển khoản
              </>
            )}
          </button>

          {/* Back Button */}
          <button
            className="btn btn-outline-secondary w-100 py-2"
            onClick={() => navigate(`/pos/payment/${lockId}`)}
            disabled={processing}
            style={{ fontSize: "0.9rem" }}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Quay lại thông tin
          </button>
        </div>
      </div>
    </div>
  );
}

export default PosQrCode;

