import express from 'express';
import {
  uploadProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addSection,
  updateSection,
  deleteSection,
} from '../controllers/projectController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.use(protect);

router.post('/upload', upload.single('midi'), uploadProject);
router.get('/', getProjects);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/sections', addSection);
router.put('/:id/sections/:sectionId', updateSection);
router.delete('/:id/sections/:sectionId', deleteSection);

export default router;
