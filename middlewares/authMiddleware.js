const jwt = require("jsonwebtoken");

class APIError extends Error {
  constructor(message, status = 500, details = {}) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = "APIError";
  }
}

function authMiddleware(req, res, next) {
  try {
    // Pega o token tanto do cookie quanto do header
    const cookieToken = req.cookies?.access_token;
    const authHeader = req.headers["authorization"];
    const headerToken = authHeader && authHeader.split(" ")[1];

    const token = cookieToken || headerToken;

    if (!token) {
      return next(
        new APIError("Token de acesso não fornecido.", 401, {
          access_token: "Token ausente",
        })
      );
    }

    const secret = process.env.JWT_SECRET || "segredo";
    if (!secret) {
      return next(new APIError("JWT_SECRET não configurado no ambiente.", 500));
    }

    // Verificação do token
    jwt.verify(token, secret, (err, user) => {
      if (err) {
        return next(
          new APIError("Token inválido ou expirado.", 401, {
            access_token: err.message,
          })
        );
      }

      // Injeta o payload do token no request
      req.user = user;
      next();
    });
  } catch (error) {
    return next(
      new APIError("Erro ao autenticar usuário.", 401, error.message)
    );
  }
}

module.exports = authMiddleware;
