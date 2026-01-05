import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import socketService from "../services/socket";
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

interface PaymentInfo {
  lockId: string;
  lockerName: string;
  deviceId: string;
  amount: number;
  orderId: string;
  description: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
  qrCodeUrl: string;
  createdAt: string;
}

function PosQrCode() {
  const { lockId } = useParams<{ lockId: string }>();
  const navigate = useNavigate();
  const [locker, setLocker] = useState<LockerDetail | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false); // Track if payment was confirmed via webhook
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  useEffect(() => {
    if (lockId) {
      loadPaymentInfo();
    }
  }, [lockId]);

  // Listen for payment confirmed event from webhook
  useEffect(() => {
    if (!lockId || !paymentInfo) {
      console.log("Waiting for lockId and paymentInfo...", {
        lockId,
        paymentInfo,
      });
      return;
    }

    console.log("Setting up payment:confirmed listener", {
      lockId,
      orderId: paymentInfo.orderId,
    });

    // Connect to WebSocket
    socketService.connect();

    // Listen for payment confirmed event
    const handlePaymentConfirmed = (data: any) => {
      console.log("🔔 handlePaymentConfirmed called with data:", data);
      console.log("Current state:", {
        lockId,
        paymentInfoOrderId: paymentInfo.orderId,
        dataLockId: data.lock_id,
        dataOrderId: data.order_id,
      });

      const { lock_id, order_id } = data;

      // Check if this payment is for the current locker and order
      if (lock_id === lockId && order_id === paymentInfo.orderId) {
        console.log(
          `✅ Payment confirmed for order ${order_id}, locker ${lock_id}`
        );

        // Mark payment as confirmed
        setPaymentConfirmed(true);

        // Automatically navigate to result page after a short delay
        setTimeout(() => {
          navigate(
            `/pos/result/${lockId}?success=true&auto=true&orderId=${order_id}`
          );
        }, 1500); // 1.5 second delay to show confirmation message
      } else {
        console.log("❌ Payment event mismatch:", {
          lockIdMatch: lock_id === lockId,
          orderIdMatch: order_id === paymentInfo.orderId,
        });
      }
    };

    socketService.on("payment:confirmed", handlePaymentConfirmed);

    // Cleanup on unmount
    return () => {
      console.log("Cleaning up payment:confirmed listener");
      socketService.off("payment:confirmed", handlePaymentConfirmed);
    };
  }, [lockId, paymentInfo, navigate]);

  const loadPaymentInfo = async () => {
    if (!lockId) return;

    setLoading(true);
    setError("");

    try {
      // Call /api/pay/:lockId to get QR code and payment info
      const response = await fetch(`${API_URL}/api/pay/${lockId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Không thể tạo mã QR thanh toán");
      }

      const data = await response.json();

      if (data.success) {
        setPaymentInfo(data);

        // Also set locker info for backward compatibility
        setLocker({
          lock_id: data.lockId,
          name: data.lockerName,
          device_id: data.deviceId,
          status: "UP",
          occupied: true,
          parking_fee: data.amount,
          hourly_rate: 0,
          car_enter_time: null,
          lock_free_time: 0,
        });
      } else {
        throw new Error(data.message || "Không thể tạo mã QR");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi tải thông tin thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!lockId || !locker || !paymentInfo) return;

    if (
      !confirm(
        `Xác nhận đã chuyển khoản ${locker.parking_fee.toLocaleString(
          "vi-VN"
        )} đ cho locker ${lockId}?\n\nMã đơn: ${
          paymentInfo.orderId
        }\n\nLocker sẽ được mở khóa tự động.`
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
          order_id: paymentInfo.orderId, // Send order_id instead of lock_id
          lock_id: lockId, // Keep for backward compatibility
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
              src={
                paymentInfo?.qrCodeUrl ||
                "https://img.vietqr.io/image/vietinbank-113366668888-compact.jpg"
              }
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
            {paymentInfo && (
              <div className="mt-2">
                <small className="text-muted d-block">
                  Nội dung: <strong>{paymentInfo.description}</strong>
                </small>
                <small className="text-muted d-block">
                  {paymentInfo.bankName} - {paymentInfo.accountNumber}
                </small>
                <small className="text-muted d-block">
                  {paymentInfo.accountName}
                </small>
              </div>
            )}
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

        {/* Payment Confirmed Message */}
        {paymentConfirmed && (
          <div className="alert alert-success mb-3" style={{ flexShrink: 0 }}>
            <i className="bi bi-check-circle-fill me-2"></i>
            <strong>Thanh toán đã được xác nhận!</strong>
            <br />
            <small>Đang chuyển đến trang kết quả...</small>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="mt-3" style={{ flexShrink: 0 }}>
          {/* Confirm Payment Button - Completely removed if payment already confirmed */}
          {!paymentConfirmed && (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PosQrCode;
