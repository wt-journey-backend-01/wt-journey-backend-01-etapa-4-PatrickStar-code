const jwt = require("jsonwebtoken");
const ApiError = require("../utils/errorHandler");

function authenticateToken(req, res, next) {
  try {
    const cookieToken = req.cookies?.access_token;
    const authHeader = req.headers["authorization"];
    const headerToken = authHeader && authHeader.split(" ")[1];

    const access_token = cookieToken || headerToken;

    if (!access_token) {
      return next(
        new ApiError("access_token não fornecido.", 401, {
          access_token: "access_token nao fornecido",
        })
      );
    }

    jwt.verify(
      access_token,
      process.env.JWT_SECRET || "segredo aqui",
      (err, user) => {
        if (err) {
          return next(
            new ApiError("access_token inválido ou expirado.", 401, {
              access_token: err.message,
            })
          );
        }

        req.user = user;
        next();
      }
    );
  } catch (error) {
    return next(new ApiError("Error authenticating user", 401, error.message));
  }
}

module.exports = authenticateToken;
