const express = require("express");
const router = express.Router();
const usuariosController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/register", usuariosController.cadastro);

router.post("/login", usuariosController.login);

router.post("/logout", usuariosController.logout);

router.delete("/users/:id", authMiddleware, usuariosController.deleteUser);

router.get("/usuarios/me", authMiddleware, usuariosController.findMe);

module.exports = router;
