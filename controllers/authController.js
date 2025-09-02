const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const usuariosRepository = require("../repositories/usuariosRepository.js");
const intPos = /^\d+$/;
const testeSenha = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

// ----- Gerar Tokens -----
function gerarAccessToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nome: usuario.nome, email: usuario.email },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "15m" }
  );
}

function gerarRefreshToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nome: usuario.nome, email: usuario.email },
    process.env.JWT_REFRESH_SECRET || "refresh_secret",
    { expiresIn: "7d" }
  );
}

// ----- Registrar Usuário -----
async function register(req, res) {
  try {
    const { nome, email, senha } = req.body;
    const erros = {};
    const camposPermitidos = ["nome", "email", "senha"];
    const campos = Object.keys(req.body);

    if (campos.some((campo) => !camposPermitidos.includes(campo))) {
      return res.status(400).json({
        status: 400,
        message: "Parâmetros inválidos",
        error: { CamposNãoPermitidos: "Campos extras não são permitidos" },
      });
    }

    if (!nome || nome.trim() === "") erros.nome = "Nome obrigatório";
    if (!email || email.trim() === "") erros.email = "E-mail obrigatório";
    if (!senha || senha.trim() === "") erros.senha = "Senha obrigatória";
    else if (!testeSenha.test(senha))
      erros.senha =
        "Senha inválida. Use uma combinação de letras maiúsculas e minúsculas, números e caracteres especiais";

    if (Object.values(erros).length > 0) {
      return res
        .status(400)
        .json({ status: 400, message: "Parâmetros inválidos", error: erros });
    }

    if (await usuariosRepository.encontrar(email)) {
      return res.status(400).json({
        status: 400,
        message: "Parâmetros inválidos",
        error: { email: "O usuário já está cadastrado" },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(senha, salt);

    const novoUsuario = { nome, email, senha: hashed };
    const usuarioCriado = await usuariosRepository.registrar(novoUsuario);
    return res
      .status(201)
      .json({ nome: usuarioCriado.nome, email: usuarioCriado.email });
  } catch (error) {
    console.log("Erro referente a: register\n", error);
    res.status(500).json({ status: 500, message: "Erro interno do servidor" });
  }
}

// ----- Login Usuário -----
async function login(req, res) {
  try {
    const { email, senha } = req.body;
    const erros = {};
    const camposPermitidos = ["email", "senha"];
    const campos = Object.keys(req.body);

    if (campos.some((campo) => !camposPermitidos.includes(campo)))
      erros.geral = "Campos não permitidos enviados";
    if (!email || email.trim() === "") erros.email = "E-mail é obrigatório";
    if (!senha || senha.trim() === "") erros.senha = "Senha é obrigatória";
    if (Object.keys(erros).length > 0)
      return res.status(400).json({
        status: 400,
        message: "Dados não enviados corretamente",
        error: erros,
      });

    const usuario = await usuariosRepository.encontrar(email);
    if (!usuario)
      return res
        .status(401)
        .json({ status: 401, message: "Credenciais inválidas" });

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida)
      return res
        .status(401)
        .json({ status: 401, message: "Credenciais inválidas" });

    const accessToken = gerarAccessToken(usuario);
    const refreshToken = gerarRefreshToken(usuario);

    // Se quiser, salvar refreshToken no DB
    // await usuariosRepository.saveRefreshToken(usuario.id, refreshToken);

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    return res
      .status(200)
      .json({ access_token: accessToken, refresh_token: refreshToken });
  } catch (error) {
    console.error("Erro referente a: login\n", error);
    res.status(500).json({ status: 500, message: "Erro interno do servidor" });
  }
}

// ----- Refresh Token -----
async function refreshToken(req, res) {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token)
      return res.status(401).json({ message: "Refresh token obrigatório" });

    try {
      const decoded = jwt.verify(
        refresh_token,
        process.env.JWT_REFRESH_SECRET || "refresh_secret"
      );
      const usuario = await usuariosRepository.encontrarPorId(decoded.id);
      if (!usuario)
        return res.status(404).json({ message: "Usuário não encontrado" });

      const novoAccessToken = gerarAccessToken(usuario);
      return res.status(200).json({ access_token: novoAccessToken });
    } catch (err) {
      return res
        .status(403)
        .json({ message: "Refresh token inválido ou expirado" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
}

// ----- Deletar Usuário -----
async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (!intPos.test(id))
      return res.status(400).json({
        status: 400,
        message: "Parâmetros inválidos",
        error: { id: "O ID deve ter um padrão válido" },
      });

    const sucesso = await usuariosRepository.deletar(id);
    if (sucesso === 0)
      return res
        .status(404)
        .json({ status: 404, message: "Usuário não encontrado" });

    return res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, message: "Erro interno do servidor" });
  }
}

// ----- Logout -----
async function logout(req, res) {
  try {
    // Se estiver salvando refresh tokens no DB, removê-los aqui
    // await usuariosRepository.removeRefreshToken(req.user.id);

    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    return res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, message: "Erro interno do servidor" });
  }
}

// ----- Exibir Usuário -----
async function findMe(req, res) {
  try {
    const email = req.user.email;
    const usuario = await usuariosRepository.encontrar(email);
    if (!usuario)
      return res
        .status(404)
        .json({ status: 404, message: "Usuário não encontrado" });

    return res
      .status(200)
      .json({ id: usuario.id, nome: usuario.nome, email: usuario.email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, message: "Erro interno do servidor" });
  }
}

module.exports = {
  register,
  login,
  refreshToken,
  deleteUser,
  logout,
  findMe,
};
