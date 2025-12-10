const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  res.status(501).json({ success: false, message: 'Not yet implemented' });
}));

router.put('/', requireAdmin, asyncHandler(async (req, res) => {
  res.status(501).json({ success: false, message: 'Not yet implemented' });
}));

module.exports = router;