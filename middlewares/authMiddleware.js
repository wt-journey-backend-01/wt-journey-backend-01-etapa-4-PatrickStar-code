const jwt = require("jsonwebtoken");

class APIError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "APIError";
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next(new APIError(401, "Token necessário"));
  }

  const secret = process.env.JWT_SECRET || "segredo";

  if (!secret) {
    // Se o segredo não estiver definido, falhe rapidamente para evitar problemas
    return next(new APIError(500, "JWT_SECRET não configurado no ambiente"));
  }

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      return next(new APIError(401, "Token inválido"));
    }
    req.user = user;
    return next();
  });
}

module.exports = authMiddleware;
