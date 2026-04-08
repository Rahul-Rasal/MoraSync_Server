import express from 'express';
import {
  getUsers,
  updateUser,
  deleteUser,
  getApiUsage,
  getHallucinationLog,
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/api-usage', getApiUsage);
router.get('/hallucination-log', getHallucinationLog);

export default router;
