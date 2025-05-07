const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createAnnouncement = async ({ title, content, userId }) => {
  return await prisma.announcement.create({
    data: {
      title,
      content,
      authorId: userId,
    },
  });
};

const getAllAnnouncements = async () => {
  return await prisma.announcement.findMany({
    include: { author: { select: { id: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

const getAnnouncementById = async (id) => {
  return await prisma.announcement.findUnique({
    where: { id: parseInt(id) },
    include: { author: true },
  });
};

module.exports = {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
};
