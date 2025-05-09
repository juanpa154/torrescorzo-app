const {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../models/employee.model');

const list = async (_req, res) => {
  const data = await getAllEmployees();
  res.json(data);
};

const create = async (req, res) => {
  const user = req.user;
  if (user.role === "viewer") return res.status(403).json({ message: "No autorizado" });

  const employee = await createEmployee(req.body);
  res.status(201).json(employee);
};

const update = async (req, res) => {
  const user = req.user;
  if (user.role !== "admin") return res.status(403).json({ message: "Solo admin puede editar" });

  const employee = await updateEmployee(req.params.id, req.body);
  res.json(employee);
};

const remove = async (req, res) => {
  const user = req.user;
  if (user.role !== "admin") return res.status(403).json({ message: "Solo admin puede eliminar" });

  await deleteEmployee(req.params.id);
  res.json({ message: "Empleado eliminado" });
};

module.exports = { list, create, update, remove };
