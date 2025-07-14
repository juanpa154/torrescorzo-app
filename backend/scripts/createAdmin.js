const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('admin444', 10);

  const existing = await prisma.user.findUnique({
    where: { email: 'admin444@demo.com' },
  });

  if (existing) {
    console.log("✅ El usuario admin ya existe.");
    return;
  }

  await prisma.user.create({
    data: {
      email: 'admin444@demo.com',
      password: hashedPassword,
      role: 'admin',
    },
  });

  console.log("✅ Usuario admin creado exitosamente.");
}

createAdmin()
  .catch((err) => console.error(err))
  .finally(() => prisma.$disconnect());
