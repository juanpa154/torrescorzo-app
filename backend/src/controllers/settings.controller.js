const {
  getAgencies, getLocations,
  createAgency, createLocation,
  deleteAgency, deleteLocation
} = require("../models/settings.model");

const listSettings = async (_req, res) => {
  const agencies = await getAgencies();
  const locations = await getLocations();
  res.json({ agencies, locations });
};

const addAgency = async (req, res) => {
  const { name } = req.body;
  const result = await createAgency(name);
  res.status(201).json(result);
};

const addLocation = async (req, res) => {
  const { name } = req.body;
  const result = await createLocation(name);
  res.status(201).json(result);
};

const removeAgency = async (req, res) => {
  await deleteAgency(parseInt(req.params.id));
  res.json({ message: "Agencia eliminada" });
};

const removeLocation = async (req, res) => {
  await deleteLocation(parseInt(req.params.id));
  res.json({ message: "Ubicación eliminada" });
};

module.exports = {
  listSettings, addAgency, addLocation, removeAgency, removeLocation
};
