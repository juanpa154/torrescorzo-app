const { prisma } = require('../db/prismaClient');

// Autorización ya resuelta en user.routes.js vía requireRole(...ROLE_GROUPS.SOLO_ADMIN)
const getAllUsers = async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true }
  });
  res.json(users);
};

const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: parseInt(id) },
    data: { role }
  });

  res.json(updatedUser);
};

module.exports = { getAllUsers, updateUserRole };
