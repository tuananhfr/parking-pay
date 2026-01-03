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

  const billingStartTime = calculateBillingStartTime();
  const paidDuration = calculatePaidDuration();

  return (
    <div className="pos-container">
      <div
        className="container-fluid h-100 d-flex flex-column px-3 py-2"
        style={{ maxWidth: "100%" }}
      >
        {/* Header */}
        <div className="text-center mb-1" style={{ flexShrink: 0 }}>
          <i
            className="bi bi-info-circle text-primary"
            style={{ fontSize: "1.5rem" }}
          ></i>
          <h5 className="mt-1 mb-0 fw-bold" style={{ fontSize: "1rem" }}>
            {locker.lock_id} - {locker.name}
          </h5>
          <div className="mt-1">
            <span
              className="badge bg-warning text-dark me-1"
              style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
            >
              {locker.status}
            </span>
            <span
              className="badge bg-danger"
              style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
            >
              Occupied
            </span>
          </div>
        </div>

        {/* Content */}
        <div
          className="flex-grow-1 overflow-hidden px-1"
          style={{ minHeight: 0 }}
        >
          {/* Locker Info Card */}
          <div className="card shadow-sm border-0 mb-1">
            <div className="card-header bg-primary text-white py-1">
              <h6 className="mb-0" style={{ fontSize: "0.85rem" }}>
                <i className="bi bi-info-circle me-1"></i>
                Thông tin locker
              </h6>
            </div>
            <div className="card-body py-1">
              <div className="row">
                <div className="col-6">
                  <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                    Device:
                  </small>{" "}
                  <span className="fw-bold" style={{ fontSize: "0.85rem" }}>
                    {locker.device_id}
                  </span>
                </div>
                <div className="col-6">
                  <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                    Locker:
                  </small>{" "}
                  <span className="fw-bold" style={{ fontSize: "0.85rem" }}>
                    {locker.lock_id}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Parking Info Card */}
          {locker.car_enter_time && (
            <div className="card shadow-sm border-0 mb-1">
              <div className="card-header bg-light py-1">
                <h6 className="mb-0" style={{ fontSize: "0.85rem" }}>
                  <i className="bi bi-clock-history me-1"></i>
                  Thông tin đỗ xe
                </h6>
              </div>
              <div className="card-body py-1">
                <div className="row mb-1">
                  <div className="col-6">
                    <small
                      className="text-muted"
                      style={{ fontSize: "0.75rem" }}
                    >
                      Xe vào:
                    </small>{" "}
                    <span className="fw-bold" style={{ fontSize: "0.8rem" }}>
                      {dayjs(locker.car_enter_time).format("DD/MM/YYYY HH:mm")}
                    </span>
                  </div>
                  <div className="col-6">
                    <small
                      className="text-muted"
                      style={{ fontSize: "0.75rem" }}
                    >
                      Đỗ:
                    </small>{" "}
                    <span
                      className="fw-bold text-primary"
                      style={{ fontSize: "0.85rem" }}
                    >
                      {formatDuration(locker.car_enter_time)}
                    </span>
                  </div>
                </div>
                {billingStartTime && (
                  <>
                    <hr className="my-1" style={{ margin: "0.25rem 0" }} />
                    <div className="row mb-1">
                      <div className="col-6">
                        <small
                          className="text-muted"
                          style={{ fontSize: "0.75rem" }}
                        >
                          Tính từ:
                        </small>{" "}
                        <span style={{ fontSize: "0.8rem" }}>
                          {dayjs(billingStartTime).format("DD/MM/YYYY HH:mm")}
                        </span>
                      </div>
                      {paidDuration && (
                        <div className="col-6">
                          <small
                            className="text-muted"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Tính:
                          </small>{" "}
                          <span
                            className="fw-bold"
                            style={{ fontSize: "0.8rem" }}
                          >
                            {paidDuration.hours()}h {paidDuration.minutes()}m
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}
                {locker.lock_free_time > 0 && (
                  <>
                    <hr className="my-1" style={{ margin: "0.25rem 0" }} />
                    <div className="row">
                      <div className="col-12">
                        <small
                          className="text-muted"
                          style={{ fontSize: "0.75rem" }}
                        >
                          Miễn phí:
                        </small>{" "}
                        <span
                          className="fw-bold text-success"
                          style={{ fontSize: "0.8rem" }}
                        >
                          {locker.lock_free_time} phút
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Payment Amount Card */}
          <div
            className="card shadow-sm border-0 mb-1"
            style={{ border: "2px solid #28a745 !important" }}
          >
            <div className="card-body py-2">
              <div className="text-center">
                <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                  Tổng tiền phải trả
                </small>
                <h2
                  className="text-success fw-bold mb-0"
                  style={{ fontSize: "1.75rem", lineHeight: "1.2" }}
                >
                  {locker.parking_fee.toLocaleString("vi-VN")} đ
                </h2>
                {locker.hourly_rate > 0 && (
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                    {locker.hourly_rate.toLocaleString("vi-VN")} đ/giờ
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="alert alert-danger mb-1 py-1"
              role="alert"
              style={{ fontSize: "0.75rem" }}
            >
              <i className="bi bi-exclamation-triangle me-1"></i>
              {error}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="mt-1" style={{ flexShrink: 0 }}>
          {/* Payment Button - Navigate to QR Code */}
          <button
            className="btn btn-primary w-100 py-2 fw-bold mb-1"
            onClick={() => navigate(`/pos/payment/${lockId}/qr`)}
            style={{ fontSize: "1rem" }}
          >
            <i className="bi bi-qr-code me-2"></i>
            Thanh toán
          </button>

          {/* Back Button */}
          <button
            className="btn btn-outline-secondary w-100 py-1"
            onClick={() => navigate("/")}
            style={{ fontSize: "0.85rem" }}
          >
            <i className="bi bi-arrow-left me-1"></i>
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}

export default PosPayment;
