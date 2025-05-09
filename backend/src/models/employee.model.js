const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllEmployees = async () => {
  return await prisma.employee.findMany({ orderBy: { name: 'asc' } });
};

const createEmployee = async (data) => {
  return await prisma.employee.create({ data });
};

const updateEmployee = async (id, data) => {
  return await prisma.employee.update({
    where: { id: parseInt(id) },
    data,
  });
};

const deleteEmployee = async (id) => {
  return await prisma.employee.delete({ where: { id: parseInt(id) } });
};

module.exports = {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
