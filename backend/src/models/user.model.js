const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

const createUser = async ({ email, password }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });
};

const findUserByEmail = async (email) => {
  return await prisma.user.findUnique({
    where: { email },
  });
};

module.exports = { createUser, findUserByEmail };
