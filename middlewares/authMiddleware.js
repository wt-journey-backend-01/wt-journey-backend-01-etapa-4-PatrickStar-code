const jwt = require("jsonwebtoken");
const errorHandler = require("../utils/errorHandler");

function authMiddleware(req, res, next) {
  try {
    const tokenHeader = req.headers.authorization;
    const token = tokenHeader && tokenHeader.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: "Token de autenticação obrigatório." });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res
          .status(401)
          .json({ message: "Token de autenticação inválido." });
      }
      req.user = decoded;
      next();
    });
  } catch (error) {
    next(error);
  }
}
module.exports = authMiddleware;
