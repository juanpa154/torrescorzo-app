const { prisma } = require('../db/prismaClient');
const {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../models/employee.model');

// Autorización ya resuelta en employee.routes.js vía requireRole(...ROLE_GROUPS)
const list = async (_req, res) => {
  const data = await getAllEmployees();
  res.json(data);
};

const create = async (req, res) => {
  const existing = await prisma.employee.findUnique({
    where: { email: req.body.email }
  });

  if (existing) return res.status(400).json({ message: "Ya existe un empleado con ese correo" });

  const employee = await createEmployee(req.body);
  res.status(201).json(employee);
};

const update = async (req, res) => {
  const employee = await updateEmployee(req.params.id, req.body);
  res.json(employee);
};

const remove = async (req, res) => {
  await deleteEmployee(req.params.id);
  res.json({ message: "Empleado eliminado" });
};

module.exports = { list, create, update, remove };
