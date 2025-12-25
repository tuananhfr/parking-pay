# 🚀 QR Payment System - Deep Link Integration

## 📋 Tổng quan

Hệ thống thanh toán QR code với Deep Link cho phép user scan QR tĩnh trên locker → Mở trang web → Click button → Mở app ngân hàng với thông tin đã điền sẵn.

## 🎯 Flow hoạt động

```
QR Code tĩnh (in trên locker)
    ↓ Scan bằng camera điện thoại
Trang web Payment Landing Page
    ↓ Hiển thị QR động + Button "Thanh toán"
    ↓ User click button
Deep Link → Mở Banking App
    ↓ Thông tin đã điền sẵn (STK, Tên, Số tiền, Nội dung)
User xác nhận
    ↓
Thanh toán thành công
    ↓ Webhook nhận notification
Backend gửi OpenLockByPayment
    ↓
Locker mở tự động
```

## 📁 Cấu trúc Project

```
parking-lock/
├── backend/                 # Main backend (port 3000)
│   └── src/
│       ├── api/
│       │   ├── routes/lockers.js
│       │   └── controllers/locker-controller.js
│       └── tcp-server/
├── backend-qr-code/         # QR Payment API (port 3001)
│   └── index.js             # API server kết nối main backend
├── frontend/                # Main admin frontend (port 5174)
└── frontend-qr-code/        # Payment landing page (port 5173)
    └── src/
        ├── App.tsx              # Router config
        ├── PaymentPage.tsx      # Payment landing page
        └── main.tsx             # Bootstrap CSS import
```

## 🛠️ Cài đặt

### 1. Main Backend (Required)

```bash
cd backend
npm install
npm run dev
```

Server chạy ở: `http://36.50.54.183:3000` (hoặc `http://localhost:3000` nếu chạy local)

### 2. Backend QR Code

**Cấu hình:**

Tạo file `.env` trong `backend-qr-code/`:
```bash
# Main Backend URL (where lockers and payment account config are stored)
MAIN_BACKEND_URL=http://36.50.54.183:3000

# QR Backend Port
PORT=3001
```

**Chạy server:**
```bash
cd backend-qr-code
npm install
npm run dev
```

Server chạy ở: `http://localhost:3001`

### 3. Frontend QR Code

```bash
cd frontend-qr-code
npm install
npm run dev
```

Server chạy ở: `http://localhost:5173`

## 🔧 API Endpoints

### GET /api/pay/:lockId

Get payment information for a specific locker.

**Backend QR Code endpoint:** `http://localhost:3001/api/pay/:lockId`

**Flow:**
1. Backend-qr-code nhận request
2. Gọi `GET http://36.50.54.183:3000/api/lockers/:lockId` (Main backend)
3. Gọi `GET http://36.50.54.183:3000/api/settings/payment-account` (Main backend)
4. Kết hợp thông tin và trả về

**Request:**
```bash
GET http://localhost:3001/api/pay/PK001-01
```

**Response:**
```json
{
  "lockId": "PK001-01",
  "lockerName": "Parking Lock 01",
  "deviceId": "PK001",
  "lockNumber": 1,
  "amount": 10000,
  "accountNumber": "100873110679",
  "accountName": "NGUYEN VAN A",
  "bankCode": "970415",
  "bankName": "Vietcombank",
  "qrCodeUrl": "https://qr.sepay.vn/img?acc=100873110679&bank=970415&amount=10000&des=PK001-01"
}
```

## 📱 Deep Link Format

### VietQR Universal Deep Link

```
intent://qr/payment?
  bankCode=970415&
  accountNumber=100873110679&
  accountName=NGUYEN%20VAN%20A&
  amount=10000&
  description=PK001-01
#Intent;
  scheme=vietqr;
  package=com.vietqr;
end;
```

Hoạt động với hầu hết banking apps:
- ✅ Vietcombank
- ✅ MB Bank
- ✅ Techcombank
- ✅ VietinBank
- ✅ ACB
- ✅ TPBank
- ✅ VPBank

## 🎨 UI Components

### Payment Landing Page

**Features:**
- ✅ Display lock information
- ✅ Show amount to pay
- ✅ Display Sepay QR code (dynamic)
- ✅ Show bank account details
- ✅ Button "Thanh toán ngay" (Deep Link trigger)
- ✅ Instructions for users
- ✅ Responsive design (mobile-first)

**Tech Stack:**
- React 19
- Bootstrap 5
- Bootstrap Icons
- React Router DOM

## 📋 QR Code Generation

### QR Code tĩnh (In trên locker)

Encode URL:
```
https://your-domain.com/pay/PK001-01
```

**Tools để generate QR:**
- [QR Code Generator](https://www.qr-code-generator.com/)
- [QRCode.js](https://github.com/davidshimjs/qrcodejs)
- Command line: `qrencode -o PK001-01.png "https://your-domain.com/pay/PK001-01"`

### In QR Code

1. Generate QR cho từng locker với URL riêng
2. Print với kích thước tối thiểu 5cm x 5cm
3. Dán lên mỗi locker tương ứng
4. Test scan bằng camera điện thoại

## 🔄 Integration với Main Backend

Backend QR Code cần connect với Main Backend để lấy payment account config:

**Environment Variable:**
```bash
# backend-qr-code/.env (optional)
MAIN_BACKEND_URL=http://localhost:3000
```

**API Call:**
```javascript
GET http://localhost:3000/api/settings/payment-account
```

## 🧪 Testing

### 1. Test Backend API

```bash
curl http://localhost:3001/api/pay/PK001-01
```

### 2. Test Frontend

1. Mở browser: `http://localhost:5173/pay/PK001-01`
2. Kiểm tra QR code hiển thị đúng
3. Kiểm tra thông tin STK, Tên, Số tiền
4. Click button "Thanh toán ngay"
5. Verify deep link trigger (console log hoặc app mở)

### 3. Test QR Code tĩnh

1. Generate QR code với URL: `http://localhost:5173/pay/PK001-01`
2. Scan bằng camera điện thoại
3. Verify trang payment mở đúng
4. Verify thông tin hiển thị chính xác

## 🚀 Deployment

### Frontend (Vercel/Netlify)

```bash
cd frontend-qr-code
npm run build
# Deploy dist/ folder
```

### Backend (PM2)

```bash
cd backend-qr-code
pm2 start index.js --name qr-payment-api
pm2 save
```

## 📊 Use Cases

### Scenario 1: User gửi xe

```
1. User gửi xe vào locker PK001-01
2. Scan QR code tĩnh dán trên locker
3. Trang web mở → Hiển thị: "10,000đ - PK001-01"
4. Click "Thanh toán ngay"
5. Vietcombank app mở với thông tin đã điền:
   - STK: 100873110679
   - Tên: NGUYEN VAN A
   - Số tiền: 10,000đ
   - Nội dung: PK001-01
6. User xác nhận (Face ID/vân tay)
7. Tiền chuyển → Webhook trigger
8. Backend gửi OpenLockByPayment(PK001-01)
9. Locker mở tự động
```

### Scenario 2: Không có app ngân hàng

```
1-3. Giống scenario 1
4. Click "Thanh toán ngay" → App không mở
5. Alert hiển thị: "Nếu app ngân hàng không mở, vui lòng quét QR code bên dưới"
6. User scan QR code động bằng app ngân hàng
7. Tiếp tục flow bình thường
```

## ⚠️ Notes

- QR Code tĩnh KHÔNG BAO GIỜ thay đổi
- Mỗi locker có 1 QR duy nhất
- Amount có thể dynamic (tính theo giờ gửi xe)
- Deep link fallback về QR code nếu app không mở được
- Cần HTTPS khi deploy production (Deep link security)

## 🎉 Summary

✅ QR Code tĩnh cho mỗi locker
✅ Landing page đẹp, responsive
✅ Deep Link mở banking app
✅ Thông tin auto-fill
✅ Fallback QR code
✅ Integration với main backend
✅ Ready to deploy!
