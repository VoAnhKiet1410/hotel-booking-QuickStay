import express from 'express';
import { subscribe, getSubscriberCount } from '../controllers/subscriberController.js';

const router = express.Router();

// Public routes — không cần auth
router.post('/', subscribe);
router.get('/count', getSubscriberCount);

export default router;
