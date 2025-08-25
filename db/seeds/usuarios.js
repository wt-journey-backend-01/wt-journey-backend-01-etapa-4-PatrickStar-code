require("dotenv").config(); // Carrega as variáveis do .env
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Limpa a tabela antes de inserir
  await knex("users").del();

  // Criptografa senhas
  const senhaHash1 = await bcrypt.hash("Senha@1234", 8);
  const senhaHash2 = await bcrypt.hash("Senha@1233214", 8);

  // Insere usuários
  const users = [
    { id: 1, nome: "Alice", email: "alice@example.com", senha: senhaHash1 },
    { id: 2, nome: "Bob", email: "bob@example.com", senha: senhaHash2 },
  ];

  await knex("users").insert(users);

  // Gera tokens JWT usando a secret key do .env
  const token1 = jwt.sign(
    { id: users[0].id, email: users[0].email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
  const token2 = jwt.sign(
    { id: users[1].id, email: users[1].email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  console.log("Seed executada com sucesso!");
  console.log("Tokens de exemplo:");
  console.log({ token1, token2 });
};
