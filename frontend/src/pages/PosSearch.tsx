import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

interface Locker {
  lock_id: string;
  name: string;
  device_id: string;
  status: string;
  occupied: boolean;
  parking_fee: number;
  car_enter_time: string | null;
}

function PosSearch() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  useEffect(() => {
    // Focus search input on mount
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (searchTerm.trim().length > 0) {
        performSearch(searchTerm);
      } else {
        setLockers([]);
        setError("");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setLockers([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/pos/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error("Lỗi tìm kiếm");
      }

      const data = await response.json();
      setLockers(data.data || []);
    } catch (err: any) {
      setError(err.message || "Lỗi tìm kiếm locker");
      setLockers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocker = (locker: Locker) => {
    navigate(`/pos/payment/${locker.lock_id}`);
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

  return (
    <div className="pos-container">
      <div
        className="container-fluid h-100 d-flex flex-column"
        style={{ maxWidth: "100%" }}
      >
        {/* Header - Fixed */}
        <div className="text-center py-3" style={{ flexShrink: 0 }}>
          <i
            className="bi bi-cash-register text-primary"
            style={{ fontSize: "2.5rem" }}
          ></i>
          <h2 className="mt-2 mb-1" style={{ fontSize: "1.75rem" }}>
            POS - Thanh toán đỗ xe
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
            Tìm kiếm locker để thanh toán
          </p>
        </div>

        {/* Search Input - Fixed */}
        <div className="px-3 mb-3" style={{ flexShrink: 0 }}>
          <div className="card shadow-sm border-0">
            <div className="card-body p-3">
              <div className="input-group input-group-lg">
                <span className="input-group-text bg-primary text-white">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="form-control"
                  placeholder="Nhập Locker ID, tên hoặc Device ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
                {loading && (
                  <span className="input-group-text">
                    <div
                      className="spinner-border spinner-border-sm text-primary"
                      role="status"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Message - Fixed */}
        {error && (
          <div className="px-3 mb-3" style={{ flexShrink: 0 }}>
            <div className="alert alert-danger mb-0" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          </div>
        )}

        {/* Results - Scrollable */}
        <div
          className="flex-grow-1 overflow-auto px-3"
          style={{ minHeight: 0 }}
        >
          {searchTerm.trim().length > 0 && !loading && (
            <>
              {lockers.length === 0 ? (
                <div className="card shadow-sm border-0 h-100 d-flex align-items-center justify-content-center">
                  <div className="text-center py-5">
                    <i
                      className="bi bi-inbox text-muted"
                      style={{ fontSize: "3rem" }}
                    ></i>
                    <p className="text-muted mt-3 mb-0">
                      Không tìm thấy locker nào
                    </p>
                  </div>
                </div>
              ) : (
                <div className="card shadow-sm border-0">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">Tìm thấy {lockers.length} locker</h6>
                  </div>
                  <div
                    className="list-group list-group-flush"
                    style={{
                      maxHeight: "calc(100vh - 250px)",
                      overflowY: "auto",
                    }}
                  >
                    {lockers.map((locker) => (
                      <button
                        key={locker.lock_id}
                        className="list-group-item list-group-item-action"
                        onClick={() => handleSelectLocker(locker)}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="mb-1">
                              {locker.name}
                              <span className="badge bg-primary ms-2">
                                {locker.lock_id}
                              </span>
                            </h6>
                            <div className="small text-muted mb-2">
                              <i className="bi bi-geo-alt me-1"></i>
                              {locker.device_id}
                              {locker.car_enter_time && (
                                <>
                                  {" • "}
                                  <i className="bi bi-clock me-1"></i>
                                  Đỗ: {formatDuration(locker.car_enter_time)}
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="h5 mb-0 text-success fw-bold">
                              {locker.parking_fee.toLocaleString("vi-VN")} đ
                            </div>
                            <span className="badge bg-warning text-dark">
                              {locker.status}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {searchTerm.trim().length === 0 && (
            <div className="card shadow-sm border-0 h-100 d-flex align-items-center justify-content-center">
              <div className="text-center py-5">
                <i
                  className="bi bi-search text-muted"
                  style={{ fontSize: "3rem" }}
                ></i>
                <p className="text-muted mt-3 mb-0">
                  Nhập Locker ID, tên hoặc Device ID để tìm kiếm
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PosSearch;
