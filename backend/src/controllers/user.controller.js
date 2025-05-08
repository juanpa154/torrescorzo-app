const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllUsers = async (req, res) => {
  const requester = req.user;

  if (requester.role !== "admin") {
    return res.status(403).json({ message: "No autorizado" });
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true }
  });
  res.json(users);
};

const updateUserRole = async (req, res) => {
  const requester = req.user;
  const { id } = req.params;
  const { role } = req.body;

  if (requester.role !== "admin") {
    return res.status(403).json({ message: "No autorizado" });
  }

  const updatedUser = await prisma.user.update({
    where: { id: parseInt(id) },
    data: { role }
  });

  res.json(updatedUser);
};

module.exports = { getAllUsers, updateUserRole };
