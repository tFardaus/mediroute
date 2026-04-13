const jwt = require('jsonwebtoken');
require('dotenv').config();

// This runs before protected routes to verify the user is logged in
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Use this to restrict routes to specific roles
// Example: roleGuard('doctor') only allows doctors
const roleGuard = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. This route is for: ${roles.join(', ')}` 
      });
    }
    next();
  };
};

module.exports = { protect, roleGuard };