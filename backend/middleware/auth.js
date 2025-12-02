// Simple auth middleware for MVP
// Supports: Admin API key (HEADER: x-api-key) and JWT Bearer tokens
// Attach `req.user` when JWT validated. Protects routes under `/api/*` by default.

const jwt = require('jsonwebtoken');

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || null;
const JWT_SECRET = process.env.JWT_SECRET || null;

module.exports = async function authMiddleware(req, res, next) {
  try {
    // Allow health and root
    if (req.path === '/' || req.path === '/health') return next();

    // Only protect API routes; allow non-API for static or other pages
    if (!req.path.startsWith('/api/') && !req.path.startsWith('/webhooks/')) {
      return next();
    }

    // 1) API Key check (header: x-api-key)
    const apiKey = req.header('x-api-key') || req.query.api_key;
    if (apiKey && ADMIN_API_KEY && apiKey === ADMIN_API_KEY) {
      req.user = { role: 'admin', apiKey: true };
      return next();
    }

    // 2) Bearer JWT check
    const authHeader = req.header('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      if (!JWT_SECRET) {
        return res.status(500).json({ error: 'JWT_SECRET not configured on server' });
      }

      try {
        const payload = jwt.verify(token, JWT_SECRET);
        // attach payload (expecting at least `sub` and optionally `tenant`)
        req.user = payload;
        return next();
      } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    // 3) No auth provided
    return res.status(401).json({ error: 'Unauthorized. Provide x-api-key or Bearer token.' });
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Auth middleware error' });
  }
};
