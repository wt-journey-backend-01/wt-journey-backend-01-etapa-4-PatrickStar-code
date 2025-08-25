const express = require("express");
const router = express.Router();
const usuariosController = require("../controllers/authController");

router.post("/auth/register", usuariosController.cadastro);

router.post("/auth/login", usuariosController.login);

router.delete("/users/:id", usuariosController.deleteUser);

router.post("/auth/logout", usuariosController.logout);

module.exports = router;
