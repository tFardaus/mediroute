const pool = require('../config/db');

const logAction = async (userId, userRole, action, resourceType, resourceId, details, req) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    await pool.query(
      `INSERT INTO audit_logs (user_id, user_role, action, resource_type, resource_id, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, userRole, action, resourceType, resourceId, ipAddress, userAgent, JSON.stringify(details)]
    );
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

const auditMiddleware = (action, resourceType) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      if (req.user && res.statusCode < 400) {
        const resourceId = req.params.id || data?.id || null;
        const details = {
          method: req.method,
          path: req.path,
          body: req.body,
          params: req.params,
          query: req.query
        };
        
        logAction(req.user.id, req.user.role, action, resourceType, resourceId, details, req)
          .catch(err => console.error('Audit logging failed:', err));
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

module.exports = { logAction, auditMiddleware };
