const db = require("../db/db");

async function findByEmail(email) {
  try {
    const findIndex = await db("usuarios").where({ email: email });
    if (findIndex.length === 0) {
      return false;
    }
    return findIndex[0];
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function create(user) {
  try {
    const created = await db("usuarios").insert(user).returning("*");
    return created[0];
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function deleteUser(id) {
  try {
    const deleted = await db("usuarios")
      .where({ id: Number(id) })
      .del();
    return deleted > 0;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function findById(id) {
  try {
    const findIndex = await db("usuarios").where({ id: Number(id) });
    if (findIndex.length === 0) {
      return null;
    }

    const user = {
      id: findIndex[0].id,
      nome: findIndex[0].nome,
      email: findIndex[0].email,
    };
    return user;
  } catch (error) {
    throw error;
  }
}

module.exports = { create, findByEmail, deleteUser, findById };
