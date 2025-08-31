const jwt = require("jsonwebtoken");
const errorHandler = require("../utils/errorHandler");

async function authMiddleware(req, res, next) {
  try {
    // Pega o token do header Authorization ou do cookie (opcional)
    const token =
      req.headers.authorization?.split(" ")[1] || req.cookies?.access_token;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Token de autenticação obrigatório." });
    }

    // Verifica o token de forma síncrona com try/catch
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expirado." });
      } else if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Token inválido." });
      } else {
        return next(err);
      }
    }

    // Adiciona os dados do token no request
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authMiddleware;
