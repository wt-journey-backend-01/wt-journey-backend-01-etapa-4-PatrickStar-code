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
    return error;
  }
}

async function create(user) {
  try {
    const created = await db("usuarios").insert(user).returning("*");
    return created[0];
  } catch (error) {
    console.log(error);
    return error;
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
    return error;
  }
}

module.exports = { create, findByEmail, deleteUser };
