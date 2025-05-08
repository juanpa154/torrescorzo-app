const {
    createAnnouncement,
    getAllAnnouncements,
    getAnnouncementById,
  } = require('../models/announcement.model');
  
  const create = async (req, res) => {
    const { title, content } = req.body;
    const user = req.user;
  
    if (user.role === "viewer") {
      return res.status(403).json({ message: "No tienes permisos para crear anuncios." });
    }
  
    if (!title || !content) {
      return res.status(400).json({ message: "Faltan datos" });
    }
  
    const announcement = await createAnnouncement({ title, content, userId: user.id });
    res.status(201).json(announcement);
  };
  
  
  const list = async (_req, res) => {
    const announcements = await getAllAnnouncements();
    res.json(announcements);
  };
  
  const getById = async (req, res) => {
    const { id } = req.params;
    const announcement = await getAnnouncementById(id);
    if (!announcement) return res.status(404).json({ message: 'No encontrado' });
  
    res.json(announcement);
  };
  
  module.exports = { create, list, getById };
  