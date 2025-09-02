const { z } = require("zod");
const express = require("express");
const usuariosRepository = require("../repositories/usuariosRepository");
const jwt = require("jsonwebtoken");
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

// Funções auxiliares para tokens
function gerarAccessToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email },
    process.env.JWT_SECRET || "segredo",
    { expiresIn: "15m" } // curto prazo
  );
}

function gerarRefreshToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email },
    process.env.JWT_REFRESH_SECRET || "refreshSegredo",
    { expiresIn: "7d" } // longo prazo
  );
}

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
      return res.status(409).json({ message: "Email já cadastrado." });
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

async function login(req, res, next) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ message: "Email e senha obrigatórios." });
    }

    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      return res.status(400).json({ messages });
    }

    const usuario = await usuariosRepository.findByEmail(email);
    if (!usuario) {
      return res.status(401).json({ message: "Usuário não encontrado." });
    }

    const senhaMatch = await bcrypt.compare(senha, usuario.senha);
    if (!senhaMatch) {
      return res.status(401).json({ message: "Senha incorreta." });
    }

    const accessToken = gerarAccessToken(usuario);
    const refreshToken = gerarRefreshToken(usuario);

    return res
      .status(200)
      .json({ access_token: accessToken, refresh_token: refreshToken });
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(401).json({ message: "Refresh token obrigatório." });
    }

    try {
      const decoded = jwt.verify(
        refresh_token,
        process.env.JWT_REFRESH_SECRET || "refreshSegredo"
      );

      const usuario = await usuariosRepository.findById(decoded.id);
      if (!usuario) {
        return res.status(404).json({ message: "Usuário não encontrado." });
      }

      const newAccessToken = gerarAccessToken(usuario);

      return res.status(200).json({ access_token: newAccessToken });
    } catch (err) {
      return res
        .status(403)
        .json({ message: "Refresh token inválido ou expirado." });
    }
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

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "segredo");
    } catch (err) {
      return res
        .status(401)
        .json({ message: "Token de autenticação inválido." });
    }

    const usuario = await usuariosRepository.findById(decoded.id);
    if (!usuario) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    return res.status(200).json(usuario);
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    const deleted = await usuariosRepository.deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Token de autenticação obrigatório." });
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET || "segredo");
    } catch (err) {
      return res
        .status(401)
        .json({ message: "Token de autenticação inválido." });
    }

    return res.status(200).json({ message: "Logout realizado com sucesso." });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  cadastro,
  login,
  refresh,
  deleteUser,
  logout,
  findMe,
};
