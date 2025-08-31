const jwt = require("jsonwebtoken");

class APIError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "APIError";
  }
}

function authMiddleware(req, res, next) {
  const cookieToken = req.cookies?.token;
  const authHeader = req.headers["authorization"];
  const headerToken = authHeader && authHeader.split(" ")[1];

  const token = headerToken || cookieToken;

  if (!token) {
    return next(new APIError(401, "Token necessário"));
  }
  jwt.verify(token, process.env.JWT_SECRET || "secret", (err, user) => {
    if (err) {
      return next(new APIError(401, "Token inválido"));
    }
    req.user = user;
    return next();
  });
}

module.exports = authMiddleware;
