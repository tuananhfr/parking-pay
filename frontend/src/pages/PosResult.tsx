import { useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";

function PosResult() {
  const { lockId } = useParams<{ lockId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const success = searchParams.get("success") === "true";

  useEffect(() => {
    // Auto redirect to search after 5 seconds if success
    if (success) {
      const timer = setTimeout(() => {
        navigate("/pos/search");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  return (
    <div className="container-fluid px-3 py-4 d-flex align-items-center justify-content-center min-vh-100">
      <div style={{ maxWidth: "500px", width: "100%" }}>
        {success ? (
          <div className="card shadow-sm border-0">
            <div className="card-body text-center py-5">
              <div className="mb-4">
                <i
                  className="bi bi-check-circle-fill text-success"
                  style={{ fontSize: "5rem" }}
                ></i>
              </div>
              <h3 className="mb-3">Thanh toán thành công!</h3>
              <div className="mb-4">
                <p className="text-muted mb-2">
                  <strong>Locker:</strong> {lockId}
                </p>
                <p className="text-muted mb-0">
                  Locker đã được mở khóa. Xe có thể ra.
                </p>
              </div>
              <div className="alert alert-success mb-4">
                <i className="bi bi-unlock me-2"></i>
                <strong>Locker đã được mở khóa tự động</strong>
              </div>
              <button
                className="btn btn-primary btn-lg w-100 mb-2"
                onClick={() => navigate("/pos/search")}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Thanh toán tiếp
              </button>
              <p className="text-muted small mb-0 mt-3">
                Tự động chuyển sau 5 giây...
              </p>
            </div>
          </div>
        ) : (
          <div className="card shadow-sm border-0">
            <div className="card-body text-center py-5">
              <div className="mb-4">
                <i
                  className="bi bi-x-circle-fill text-danger"
                  style={{ fontSize: "5rem" }}
                ></i>
              </div>
              <h3 className="mb-3">Thanh toán thất bại</h3>
              <p className="text-muted mb-4">
                Có lỗi xảy ra khi xử lý thanh toán. Vui lòng thử lại.
              </p>
              <button
                className="btn btn-primary w-100 mb-2"
                onClick={() => navigate(`/pos/payment/${lockId}`)}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Thử lại
              </button>
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => navigate("/pos/search")}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Quay lại tìm kiếm
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PosResult;
