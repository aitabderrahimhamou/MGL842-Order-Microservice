const jwt = require('jsonwebtoken');
const logger = require('../logger')
require('dotenv').config();

function isAuthenticated(req, res, next) {
  //logger.info("executing middleware isAuthenticated in the service order")
  // Check for the presence of an authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    logger.error("User unauthorized")
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Extract the token from the header
  const token = authHeader.split(' ')[1];

  try {
    // Verify the token using the JWT library and the secret key
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

module.exports = isAuthenticated;
