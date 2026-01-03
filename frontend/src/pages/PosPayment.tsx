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

function PosPayment() {
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
        `Xác nhận đã chuyển khoản ${locker.parking_fee.toLocaleString("vi-VN")} đ cho locker ${lockId}?\n\nLocker sẽ được mở khóa tự động.`
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

  const formatDuration = (enterTime: string | null) => {
    if (!enterTime) return "-";
    const enter = dayjs(enterTime);
    const now = dayjs();
    const dur = dayjs.duration(now.diff(enter));
    const hours = dur.hours();
    const minutes = dur.minutes();
    return `${hours} giờ ${minutes} phút`;
  };

  const calculateBillingStartTime = () => {
    if (!locker?.car_enter_time || !locker.lock_free_time) return null;
    return dayjs(locker.car_enter_time)
      .add(locker.lock_free_time, "minute")
      .toISOString();
  };

  const calculatePaidDuration = () => {
    const billingStart = calculateBillingStartTime();
    if (!billingStart || !dayjs(billingStart).isBefore(dayjs())) return null;
    const dur = dayjs.duration(dayjs().diff(dayjs(billingStart)));
    return dur;
  };

  if (loading) {
    return (
      <div className="container-fluid px-3 py-4 d-flex align-items-center justify-content-center min-vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-3 text-muted">Đang tải thông tin locker...</p>
        </div>
      </div>
    );
  }

  if (error || !locker) {
    return (
      <div className="container-fluid px-3 py-4" style={{ maxWidth: "600px" }}>
        <div className="card shadow-sm border-0">
          <div className="card-body text-center py-5">
            <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: "3rem" }}></i>
            <h5 className="mt-3">Lỗi</h5>
            <p className="text-muted">{error || "Không tìm thấy locker"}</p>
            <button className="btn btn-primary" onClick={() => navigate("/pos/search")}>
              <i className="bi bi-arrow-left me-2"></i>
              Quay lại tìm kiếm
            </button>
          </div>
        </div>
      </div>
    );
  }

  const billingStartTime = calculateBillingStartTime();
  const paidDuration = calculatePaidDuration();

  return (
    <div className="container-fluid px-3 py-4" style={{ maxWidth: "600px" }}>
      {/* Header */}
      <div className="text-center mb-4">
        <i className="bi bi-cash-register text-primary" style={{ fontSize: "2.5rem" }}></i>
        <h3 className="mt-2 mb-1">Thanh toán đỗ xe</h3>
        <p className="text-muted small">Locker: {locker.lock_id}</p>
      </div>

      {/* Locker Info Card */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">
            <i className="bi bi-info-circle me-2"></i>
            Thông tin locker
          </h5>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-6">
              <small className="text-muted">Locker ID</small>
              <div className="fw-bold">{locker.lock_id}</div>
            </div>
            <div className="col-6">
              <small className="text-muted">Tên</small>
              <div className="fw-bold">{locker.name}</div>
            </div>
          </div>
          <div className="row">
            <div className="col-6">
              <small className="text-muted">Device</small>
              <div>{locker.device_id}</div>
            </div>
            <div className="col-6">
              <small className="text-muted">Trạng thái</small>
              <div>
                <span className="badge bg-warning text-dark">{locker.status}</span>
                <span className="badge bg-danger ms-2">Occupied</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Parking Info Card */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-light">
          <h6 className="mb-0">
            <i className="bi bi-clock-history me-2"></i>
            Thông tin đỗ xe
          </h6>
        </div>
        <div className="card-body">
          {locker.car_enter_time ? (
            <>
              <div className="row mb-2">
                <div className="col-6">
                  <small className="text-muted">Thời gian xe vào</small>
                  <div className="fw-bold">
                    {dayjs(locker.car_enter_time).format("DD/MM/YYYY HH:mm:ss")}
                  </div>
                </div>
                <div className="col-6">
                  <small className="text-muted">Thời gian đỗ</small>
                  <div className="fw-bold">{formatDuration(locker.car_enter_time)}</div>
                </div>
              </div>
              {billingStartTime && (
                <div className="row mb-2">
                  <div className="col-6">
                    <small className="text-muted">Bắt đầu tính tiền</small>
                    <div>
                      {dayjs(billingStartTime).format("DD/MM/YYYY HH:mm:ss")}
                    </div>
                  </div>
                  {paidDuration && (
                    <div className="col-6">
                      <small className="text-muted">Thời gian tính tiền</small>
                      <div>
                        {paidDuration.hours()} giờ {paidDuration.minutes()} phút
                      </div>
                    </div>
                  )}
                </div>
              )}
              {locker.lock_free_time > 0 && (
                <div className="row">
                  <div className="col-12">
                    <small className="text-muted">Thời gian miễn phí</small>
                    <div>{locker.lock_free_time} phút</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-muted">Chưa có thông tin xe vào</div>
          )}
        </div>
      </div>

      {/* Payment Amount Card */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="text-center mb-3">
            <small className="text-muted">Tổng tiền phải trả</small>
            <h1 className="text-success fw-bold mb-0">
              {locker.parking_fee.toLocaleString("vi-VN")} đ
            </h1>
            {locker.hourly_rate > 0 && (
              <small className="text-muted">
                {locker.hourly_rate.toLocaleString("vi-VN")} đ/giờ
              </small>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Confirm Payment Button */}
      <button
        className="btn btn-success btn-lg w-100 py-3 fw-bold mb-3"
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
        className="btn btn-outline-secondary w-100"
        onClick={() => navigate("/pos/search")}
        disabled={processing}
      >
        <i className="bi bi-arrow-left me-2"></i>
        Quay lại tìm kiếm
      </button>

      {/* Info Alert */}
      <div className="alert alert-info mt-3 mb-0">
        <small>
          <i className="bi bi-info-circle me-1"></i>
          Sau khi xác nhận, locker sẽ tự động mở khóa và xe có thể ra.
        </small>
      </div>
    </div>
  );
}

export default PosPayment;

