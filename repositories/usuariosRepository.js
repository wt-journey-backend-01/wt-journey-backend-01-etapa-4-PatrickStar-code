const db = require("../db/db");

async function findByEmail(email) {
  try {
    const findIndex = await db("users").where({ email: email });
    if (findIndex.length === 0) {
      return false;
    }
    return findIndex[0];
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function create(user) {
  try {
    const created = await db("users").insert(user).returning("*");
    return created[0];
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function deleteUser(id) {
  try {
    const deleted = await db("users")
      .where({ id: Number(id) })
      .del();
    return deleted > 0;
  } catch (error) {
    console.log(error);
    return false;
  }
}

module.exports = { create, findByEmail, deleteUser };
