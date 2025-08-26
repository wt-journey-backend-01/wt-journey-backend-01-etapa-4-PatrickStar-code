const { z } = require("zod");
const express = require("express");
const usuariosRepository = require("../repositories/usuariosRepository");
const jwt = require("jsonwebtoken");
const errorHandler = require("../utils/errorHandler");
const bcrypt = require("bcryptjs");

const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

const UsuarioSchema = z
  .object({
    nome: z.string().min(1, "O campo 'nome' é obrigatório."),
    email: z.email(),
    senha: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres.")
      .regex(senhaRegex, {
        message:
          "A senha deve conter pelo menos uma letra minúscula, uma maiúscula, um número e um caractere especial.",
      }),
  })
  .strict();

const LoginSchema = z.object({
  email: z.email(),
  senha: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres.")
    .regex(senhaRegex, {
      message:
        "A senha deve conter pelo menos uma letra minúscula, uma maiúscula, um número e um caractere especial.",
    }),
});

async function cadastro(req, res, next) {
  try {
    const { email, senha, nome } = req.body;

    if ((!email || !senha, !nome)) {
      return res
        .status(400)
        .json({ message: "Email,Senha e nome obrigatorio." });
    }

    const parsed = UsuarioSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }

    const usuario = await usuariosRepository.findByEmail(email);
    if (usuario) {
      return res.status(400).json({ message: "Email ja cadastrado." });
    }

    const senhaHash = await bycrypt.hash(senha, 8);

    const newUsuario = await usuariosRepository.create({
      nome,
      email,
      senha: senhaHash,
    });

    return res.status(201).json(newUsuario);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ message: "Email e senha obrigatorio." });
    }

    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }

    const usuario = await usuariosRepository.findByEmail(email);
    if (!usuario) {
      return res.status(400).json({ message: "Usuario nao encontrado." });
    }

    const senhaMatch = await bycrypt.compare(senha, usuario.senha);
    if (!senhaMatch) {
      return res.status(401).json({ message: "Senha incorreta." });
    }

    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(200).json({ acess_token: token });
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const id = req.params.id;
    const deleted = await usuariosRepository.deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ message: "Usuario nao encontrado." });
    }
    return res.status(204).send();
  } catch (error) {}
}

async function logout(req, res, next) {
  try {
    return res.status(200).json({ message: "Logout realizado com sucesso." });
  } catch (error) {
    next(error);
  }
}
module.exports = {
  cadastro,
  login,
  deleteUser,
  logout,
};
