const jwt = require("jsonwebtoken");

/**
 * Optional authentication middleware
 * Sets req.user if token is valid, but allows request to proceed without token
 */
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // No token provided, continue without user
    req.user = null;
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    // Invalid token, continue without user
    req.user = null;
    next();
  }
};
