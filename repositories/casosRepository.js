const db = require("../db/db");

async function getAll({ agente_id, status } = {}) {
  try {
    let search = db.select("*").from("casos");
    if (agente_id !== undefined) {
      search = search.where({ agente_id: Number(agente_id) });
    }
    if (status) {
      search = search.where({ status });
    }
    return await search;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function search(q) {
  try {
    const query = await db
      .select("*")
      .from("casos")
      .where(function () {
        this.where("titulo", "ilike", `%${q}%`).orWhere(
          "descricao",
          "ilike",
          `%${q}%`
        );
      });

    return query.length > 0 ? query : [];
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function create(caso) {
  try {
    const created = await db("casos").insert(caso).returning("*");
    return created[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function findById(id) {
  try {
    const result = await db("casos").where({ id: Number(id) });
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function update(id, fieldsToUpdate) {
  try {
    const updated = await db("casos")
      .where({ id: Number(id) })
      .update(fieldsToUpdate, ["*"]);
    return updated && updated.length > 0 ? updated[0] : null;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function deleteCaso(id) {
  try {
    const deleted = await db("casos")
      .where({ id: Number(id) })
      .del();
    return deleted > 0 ? true : null;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function deleteByAgente(id) {
  try {
    const deleted = await db("casos")
      .where({ agente_id: Number(id) })
      .del();
    return deleted > 0 ? true : null;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = {
  getAll,
  search,
  create,
  findById,
  deleteCaso,
  update,
  deleteByAgente,
};
