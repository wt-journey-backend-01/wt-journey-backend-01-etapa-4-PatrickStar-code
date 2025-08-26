const express = require("express");
const router = express.Router();
const usuariosController = require("../controllers/authController");

router.delete("/:id", usuariosController.deleteUser);

module.exports = router;
