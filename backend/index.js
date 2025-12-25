require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Main backend API URL
const MAIN_BACKEND_URL = process.env.MAIN_BACKEND_URL || 'http://36.50.54.183:3000';

/**
 * GET /api/pay/:lockId
 * Get payment information for a specific lock
 */
app.get('/api/pay/:lockId', async (req, res) => {
  try {
    const { lockId } = req.params;

    // Fetch locker info from main backend
    const lockerResponse = await axios.get(`${MAIN_BACKEND_URL}/api/lockers/${lockId}`);
    const lockerData = lockerResponse.data.data;

    if (!lockerData) {
      return res.status(404).json({
        success: false,
        message: `Locker ${lockId} not found`
      });
    }

    // Fetch payment account config from main backend
    const accountResponse = await axios.get(`${MAIN_BACKEND_URL}/api/payments/account`);
    const accountData = accountResponse.data.data;

    if (!accountData || !accountData.accountNumber) {
      return res.status(500).json({
        success: false,
        message: 'Payment account not configured'
      });
    }

    // Build payment info
    const amount = 10000; // Default amount, can be dynamic based on parking rules
    const bankCode = accountData.acqId || '970415';
    const bankName = getBankName(bankCode);

    // Build Sepay QR URL
    const qrCodeUrl = `https://qr.sepay.vn/img?acc=${accountData.accountNumber}&bank=${bankCode}&amount=${amount}&des=${lockId}`;

    const paymentInfo = {
      lockId,
      lockerName: lockerData.name || lockId,
      deviceId: lockerData.device_id,
      lockNumber: lockerData.lock_number,
      amount,
      accountNumber: accountData.accountNumber,
      accountName: accountData.accountName,
      bankCode,
      bankName,
      qrCodeUrl
    };

    res.json(paymentInfo);
  } catch (error) {
    console.error('Error getting payment info:', error);

    // Handle 404 from main backend
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        success: false,
        message: `Locker ${req.params.lockId} not found`
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

/**
 * Helper: Get bank name from bank code
 */
function getBankName(bankCode) {
  const banks = {
    '970415': 'Vietcombank',
    '970416': 'ACB',
    '970418': 'Techcombank',
    '970422': 'MB Bank',
    '970423': 'TPBank',
    '970436': 'Vietinbank',
    '970407': 'Sacombank',
    '970405': 'Agribank',
    '970432': 'VP Bank',
    'ICB': 'VietinBank',  // ICB is VietinBank's old code
  };
  return banks[bankCode] || 'Ngân hàng';
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend QR Code running on http://localhost:${PORT}`);
  console.log(`📡 Main backend URL: ${MAIN_BACKEND_URL}`);
});
