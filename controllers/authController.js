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

    if (!email || !senha || !nome) {
      return res
        .status(400)
        .json({ message: "Email, Senha e nome obrigatórios." });
    }

    const parsed = UsuarioSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      return res.status(400).json({ messages });
    }

    const usuario = await usuariosRepository.findByEmail(email);
    if (usuario) {
      return res.status(400).json({ message: "Email já cadastrado." });
    }

    const senhaHash = await bcrypt.hash(senha, 8);

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

async function findMe(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Token de autenticação obrigatório." });
    }

    // Verifica e decodifica o token de forma síncrona
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ message: "Token de autenticação inválido." });
    }

    // Busca usuário
    const usuario = await usuariosRepository.findById(decoded.id);
    if (!usuario) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    return res.status(200).json(usuario);
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
      const messages = parsed.error.issues.map((issue) => issue.message);
      return res.status(400).json({ messages });
    }

    const usuario = await usuariosRepository.findByEmail(email);
    if (!usuario) {
      return res.status(400).json({ message: "Usuario nao encontrado." });
    }

    const senhaMatch = await bcrypt.compare(senha, usuario.senha);
    if (!senhaMatch) {
      return res.status(401).json({ message: "Senha incorreta." });
    }

    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(200).json({ access_token: token });
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
  findMe,
};
