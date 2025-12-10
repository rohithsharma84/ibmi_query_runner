/**
 * Query Set Routes
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  res.status(501).json({ success: false, message: 'Not yet implemented' });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  res.status(501).json({ success: false, message: 'Not yet implemented' });
}));

router.post('/', asyncHandler(async (req, res) => {
  res.status(501).json({ success: false, message: 'Not yet implemented' });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  res.status(501).json({ success: false, message: 'Not yet implemented' });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  res.status(501).json({ success: false, message: 'Not yet implemented' });
}));

router.post('/:id/refresh', asyncHandler(async (req, res) => {
  res.status(501).json({ success: false, message: 'Not yet implemented' });
}));

module.exports = router;