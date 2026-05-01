const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const pool = require('../config/db');
const crypto = require('crypto');

const generateSecret = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  const userEmail = req.user.email;

  try {
    const secret = speakeasy.generateSecret({
      name: `MediRoute (${userEmail})`,
      length: 32
    });

    const existing = await pool.query(
      `SELECT * FROM two_factor_auth WHERE user_id = $1 AND user_role = $2`,
      [userId, userRole]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE two_factor_auth SET secret = $1 WHERE user_id = $2 AND user_role = $3`,
        [secret.base32, userId, userRole]
      );
    } else {
      await pool.query(
        `INSERT INTO two_factor_auth (user_id, user_role, secret) VALUES ($1, $2, $3)`,
        [userId, userRole, secret.base32]
      );
    }

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const enableTwoFactor = async (req, res) => {
  const { token } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const result = await pool.query(
      `SELECT secret FROM two_factor_auth WHERE user_id = $1 AND user_role = $2`,
      [userId, userRole]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '2FA not set up. Generate secret first.' });
    }

    const secret = result.rows[0].secret;
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid token.' });
    }

    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    await pool.query(
      `UPDATE two_factor_auth SET is_enabled = TRUE, backup_codes = $1 
       WHERE user_id = $2 AND user_role = $3`,
      [backupCodes, userId, userRole]
    );

    res.json({
      message: '2FA enabled successfully.',
      backupCodes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const disableTwoFactor = async (req, res) => {
  const { token } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const result = await pool.query(
      `SELECT secret FROM two_factor_auth WHERE user_id = $1 AND user_role = $2 AND is_enabled = TRUE`,
      [userId, userRole]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '2FA not enabled.' });
    }

    const secret = result.rows[0].secret;
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid token.' });
    }

    await pool.query(
      `UPDATE two_factor_auth SET is_enabled = FALSE, backup_codes = NULL 
       WHERE user_id = $1 AND user_role = $2`,
      [userId, userRole]
    );

    res.json({ message: '2FA disabled successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const verifyTwoFactor = async (req, res) => {
  const { userId, userRole, token } = req.body;

  try {
    const result = await pool.query(
      `SELECT secret, backup_codes FROM two_factor_auth 
       WHERE user_id = $1 AND user_role = $2 AND is_enabled = TRUE`,
      [userId, userRole]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '2FA not enabled for this user.' });
    }

    const { secret, backup_codes } = result.rows[0];

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (verified) {
      return res.json({ verified: true });
    }

    if (backup_codes && backup_codes.includes(token)) {
      const updatedCodes = backup_codes.filter(code => code !== token);
      await pool.query(
        `UPDATE two_factor_auth SET backup_codes = $1 WHERE user_id = $2 AND user_role = $3`,
        [updatedCodes, userId, userRole]
      );
      return res.json({ verified: true, usedBackupCode: true });
    }

    res.status(400).json({ verified: false, error: 'Invalid token.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

const getTwoFactorStatus = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const result = await pool.query(
      `SELECT is_enabled, backup_codes FROM two_factor_auth 
       WHERE user_id = $1 AND user_role = $2`,
      [userId, userRole]
    );

    if (result.rows.length === 0) {
      return res.json({ enabled: false, backupCodesCount: 0 });
    }

    const { is_enabled, backup_codes } = result.rows[0];
    res.json({
      enabled: is_enabled,
      backupCodesCount: backup_codes ? backup_codes.length : 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = {
  generateSecret,
  enableTwoFactor,
  disableTwoFactor,
  verifyTwoFactor,
  getTwoFactorStatus
};
