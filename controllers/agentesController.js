const { z } = require("zod");
const express = require("express");
const agentesRepository = require("../repositories/agentesRepository");
const errorHandler = require("../utils/errorHandler");
const casosRepository = require("../repositories/casosRepository");

const AgenteSchema = z.object({
  nome: z.string().min(1, "O campo 'nome' não pode ser vazio."),
  dataDeIncorporacao: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "O campo 'dataDeIncorporacao' deve ser no formato 'YYYY-MM-DD'.",
    })
    .refine((dateStr) => {
      const date = new Date(dateStr);
      const now = new Date();
      return date <= now;
    }, "A data de incorporação não pode ser no futuro."),
  cargo: z.string().min(1, "O campo 'cargo' não pode ser vazio."),
});

const AgentePartial = AgenteSchema.partial().strict();

const querySchema = z.object({
  cargo: z.string().optional(),
  sort: z.enum(["dataDeIncorporacao", "-dataDeIncorporacao"]).optional(),
});

async function findAll(req, res, next) {
  try {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      return res.status(400).json({ messages });
    }

    const { cargo, sort } = parsed.data;

    const agentes = await agentesRepository.findAll({
      cargo,
      sort,
    });
    return res.status(200).json(agentes);
  } catch (error) {
    next(error);
  }
}

async function findById(req, res, next) {
  try {
    const idNum = Number(req.params.id);
    if (Number.isNaN(idNum)) {
      return res.status(400).json({ message: "ID inválido" });
    }
    const agente = await agentesRepository.findById(idNum);
    if (!agente) {
      return res.status(404).json({ message: "Agente inexistente" });
    }
    return res.status(200).json(agente);
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const parsed = AgenteSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      return res.status(400).json({ messages });
    }

    const agente = await agentesRepository.create(parsed.data);
    if (!agente) {
      return res.status(500).json({ message: "Erro ao criar agente." });
    }
    return res.status(201).json(agente);
  } catch (error) {
    next(error);
  }
}

async function deleteAgente(req, res, next) {
  try {
    const { id } = req.params;
    const idNum = Number(req.params.id);
    if (Number.isNaN(idNum)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const inCase = await casosRepository.deleteByAgente(idNum);
    if (!inCase) {
      console.log("Agente não tem casos");
    }
    const deleted = await agentesRepository.deleteAgente(idNum);
    if (!deleted) {
      return res.status(404).json({ message: "Agente inexistente" });
    }
    return res.status(204).send();
  } catch (error) {
    console.log(error);
    next(error);
  }
}

async function updateAgente(req, res, next) {
  try {
    const { id } = req.params;
    const idNum = Number(req.params.id);
    if (Number.isNaN(idNum)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    if ("id" in req.body) {
      return res
        .status(400)
        .json({ message: "O campo 'id' nao pode ser alterado." });
    }
    const parsed = AgenteSchema.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      return res.status(400).json({ messages });
    }

    const agenteUpdated = await agentesRepository.updateAgente(
      idNum,
      parsed.data
    );

    if (agenteUpdated === null) {
      return res
        .status(404)
        .json({ message: "Agente não atualizado/não encontrado" });
    }

    return res.status(200).json(agenteUpdated);
  } catch (error) {
    next(error);
  }
}

async function patch(req, res, next) {
  try {
    const { id } = req.params;
    const idNum = Number(req.params.id);
    if (Number.isNaN(idNum)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    if ("id" in req.body) {
      return res
        .status(400)
        .json({ message: "O campo 'id' nao pode ser alterado." });
    }

    const parsed = AgentePartial.safeParse(req.body);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      return res.status(400).json({ messages });
    }

    const agenteUpdated = await agentesRepository.updateAgente(
      idNum,
      parsed.data
    );

    if (agenteUpdated === null) {
      return res
        .status(404)
        .json({ message: "Agente não atualizado/não encontrado" });
    }

    return res.status(200).json(agenteUpdated);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  findAll,
  findById,
  create,
  deleteAgente,
  updateAgente,
  patch,
};
