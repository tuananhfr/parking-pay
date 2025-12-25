import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface PaymentInfo {
  lockId: string;
  lockerName: string;
  deviceId: string;
  lockNumber: number;
  amount: number;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
  qrCodeUrl: string;
}

function PaymentPage() {
  const { lockId } = useParams<{ lockId: string }>();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    loadPaymentInfo();
  }, [lockId]);

  const loadPaymentInfo = async () => {
    try {
      // Call backend-qr-code API to get payment info for this lockId
      const response = await fetch(`${API_URL}/api/pay/${lockId}`);
      if (!response.ok) {
        throw new Error("Không tìm thấy thông tin thanh toán");
      }
      const data = await response.json();
      setPaymentInfo(data);
    } catch (err: any) {
      setError(err.message || "Lỗi tải thông tin thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (!paymentInfo) return;

    // Build deep link for banking app
    const description = `Parking ${paymentInfo.lockId}`;
    const deepLink = buildDeepLink(
      paymentInfo.accountNumber,
      paymentInfo.accountName,
      paymentInfo.amount,
      description
    );

    // Try to open banking app
    window.location.href = deepLink;

    // Fallback: If banking app not installed, show QR code
    setTimeout(() => {
      alert("Nếu app ngân hàng không mở, vui lòng quét QR code bên dưới");
    }, 2000);
  };

  const buildDeepLink = (
    accountNumber: string,
    accountName: string,
    amount: number,
    description: string
  ): string => {
    // VietQR deep link format (works with most banking apps)
    const params = new URLSearchParams({
      bankCode: paymentInfo?.bankCode || "970415",
      accountNumber: accountNumber,
      accountName: accountName,
      amount: String(amount),
      description: description,
    });

    // Universal banking deep link (Android Intent)
    return `intent://qr/payment?${params.toString()}#Intent;scheme=vietqr;package=com.vietqr;end;`;
  };

  if (loading) {
    return (
      <div className="container min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div
            className="spinner-border text-primary"
            role="status"
            style={{ width: "3rem", height: "3rem" }}
          >
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-3 text-muted">Đang tải thông tin thanh toán...</p>
        </div>
      </div>
    );
  }

  if (error || !paymentInfo) {
    return (
      <div className="container min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <i
            className="bi bi-exclamation-triangle text-danger"
            style={{ fontSize: "4rem" }}
          ></i>
          <h3 className="mt-3">Lỗi</h3>
          <p className="text-muted">
            {error || "Không tìm thấy thông tin thanh toán"}
          </p>
          <a href="/" className="btn btn-primary mt-3">
            <i className="bi bi-house me-2"></i>
            Về trang chủ
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container-fluid px-3 py-3 py-md-4"
      style={{ maxWidth: "500px" }}
    >
      {/* Header */}
      <div className="text-center mb-3 mb-md-4">
        <i
          className="bi bi-p-circle text-primary"
          style={{ fontSize: "2.5rem" }}
        ></i>
        <h3 className="mt-2 mb-1">Thanh toán Parking</h3>
        <p className="text-muted small mb-0">
          Quét QR hoặc nhấn nút thanh toán
        </p>
      </div>

      {/* Payment Card */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-3 p-md-4">
          {/* Lock Info */}
          <div className="bg-light rounded p-3 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <small className="text-muted">Vị trí</small>
                <h5 className="mb-0">{paymentInfo.lockerName}</h5>
              </div>
              <div className="text-end">
                <small className="text-muted">Số tiền</small>
                <h4 className="mb-0 text-primary fw-bold">
                  {paymentInfo.amount.toLocaleString("vi-VN")}đ
                </h4>
              </div>
            </div>
            <div className="small text-muted">
              <i className="bi bi-tag me-1"></i>
              <span className="font-monospace">{paymentInfo.lockId}</span>
              {" • "}
              Lock #{paymentInfo.lockNumber}
            </div>
          </div>

          {/* QR Code */}
          <div className="text-center mb-3">
            <img
              src={paymentInfo.qrCodeUrl}
              alt="QR Code"
              className="img-fluid rounded border"
              style={{ maxWidth: "280px", width: "100%" }}
            />
            <p className="text-muted small mt-2 mb-0">
              <i className="bi bi-qr-code me-1"></i>
              Quét mã QR bằng app ngân hàng
            </p>
          </div>

          {/* Bank Info */}
          <div className="border-top pt-3 mb-3">
            <div className="row g-2 small">
              <div className="col-5">
                <strong>Ngân hàng:</strong>
              </div>
              <div className="col-7 text-end">{paymentInfo.bankName}</div>
              <div className="col-5">
                <strong>Số TK:</strong>
              </div>
              <div className="col-7 text-end font-monospace">
                {paymentInfo.accountNumber}
              </div>
              <div className="col-5">
                <strong>Chủ TK:</strong>
              </div>
              <div className="col-7 text-end">{paymentInfo.accountName}</div>
            </div>
          </div>

          {/* Payment Button */}
          <button
            className="btn btn-primary w-100 py-3 fw-bold mb-3"
            onClick={handlePayment}
            style={{ fontSize: "1.1rem" }}
          >
            <i className="bi bi-credit-card me-2"></i>
            Thanh toán ngay
          </button>

          {/* Instructions */}
          <div className="alert alert-info mb-0 py-2">
            <small>
              <i className="bi bi-info-circle me-1"></i>
              Nhấn nút "Thanh toán ngay" để mở app ngân hàng, hoặc quét QR code
              bằng app của bạn.
            </small>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-3">
        <small className="text-muted">
          Sau khi thanh toán thành công, bãi xe sẽ tự động mở
        </small>
      </div>
    </div>
  );
}

export default PaymentPage;
