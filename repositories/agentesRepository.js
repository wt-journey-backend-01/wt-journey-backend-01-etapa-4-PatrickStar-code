const db = require("../db/db");

async function findAll({ cargo, sort } = {}) {
  try {
    let search = db.select("*").from("agentes");
    if (cargo) {
      search = search.where({ cargo });
    }
    if (sort) {
      if (sort === "dataDeIncorporacao") {
        search = search.orderBy("dataDeIncorporacao", "asc");
      } else if (sort === "-dataDeIncorporacao") {
        search = search.orderBy("dataDeIncorporacao", "desc");
      }
    }
    return await search;
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function findById(id) {
  try {
    const findIndex = await db("agentes").where({ id: Number(id) });
    if (findIndex.length === 0) {
      return false;
    }
    return findIndex[0];
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function create(agente) {
  try {
    const created = await db("agentes").insert(agente).returning("*");
    return created[0];
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function deleteAgente(id) {
  try {
    const agenteIdNum = Number(id);
    const deleted = await db("casos").where({ agente_id: agenteIdNum }).del();
    return deleted > 0;
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function updateAgente(id, fieldsToUpdate) {
  try {
    if (fieldsToUpdate.dataDeIncorporacao) {
      fieldsToUpdate.dataDeIncorporacao = fieldsToUpdate.dataDeIncorporacao;
    }

    const updateAgente = await db("agentes")
      .where({ id: Number(id) })
      .update(fieldsToUpdate, ["*"]);

    if (!updateAgente || updateAgente.length === 0) {
      return false;
    }
    return updateAgente[0];
  } catch (error) {
    console.log(error);
    return false;
  }
}

module.exports = {
  findAll,
  findById,
  create,
  deleteAgente,
  updateAgente,
};
