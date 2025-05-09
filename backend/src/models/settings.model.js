const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAgencies = async () => await prisma.agency.findMany({ orderBy: { name: 'asc' } });
const getLocations = async () => await prisma.location.findMany({ orderBy: { name: 'asc' } });

const createAgency = async (name) => await prisma.agency.create({ data: { name } });
const createLocation = async (name) => await prisma.location.create({ data: { name } });

const deleteAgency = async (id) => await prisma.agency.delete({ where: { id } });
const deleteLocation = async (id) => await prisma.location.delete({ where: { id } });

module.exports = {
  getAgencies, getLocations,
  createAgency, createLocation,
  deleteAgency, deleteLocation
};
