import express from 'express';
import {
  generate,
  updatePhrase,
  toggleLock,
  saveAll,
  exportSynthV,
} from '../controllers/lyricController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/generate', generate);
router.put('/:versionId/section/:sectionId', updatePhrase);
router.put('/:versionId/section/:sectionId/lock', toggleLock);
router.post('/:versionId/save-all', saveAll);
router.get('/:versionId/export', exportSynthV);

export default router;
