const express = require("express");
const router = express.Router();
const usuariosController = require("../controllers/authController");
const authenticateToken = require("../middlewares/authMiddleware");

router.post("/register", usuariosController.cadastro);

router.post("/login", usuariosController.login);

router.post("/logout", usuariosController.logout);

router.delete("/users/:id", authenticateToken, usuariosController.deleteUser);

router.get("/usuarios/me", authenticateToken, usuariosController.findMe);

module.exports = router;
