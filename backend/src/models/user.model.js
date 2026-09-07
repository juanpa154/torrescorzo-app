const { prisma } = require('../db/prismaClient');
const bcrypt = require('bcryptjs');

const createUser = async ({ email, password, role, agencySchema = null }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role,
      agencySchema,
    },
  });
};


const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: { email },
  });
};

module.exports = { createUser, findUserByEmail };
