const express = require("express");
const router = express.Router();
const usuariosController = require("../controllers/authController");

router.post("/register", usuariosController.cadastro);

router.post("/login", usuariosController.login);

router.post("/logout", usuariosController.logout);

router.delete("/users/:id", usuariosController.deleteUser);

router.get("/usuarios/me", usuariosController.findMe);

module.exports = router;
