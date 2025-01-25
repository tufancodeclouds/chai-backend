import { Router } from 'express';
import {
    getChannelStats,
    getChannelVideos,
} from "../controllers/dashboard.controller.js"
import {authenticate} from "../middlewares/authenticate.middleware.js"

const router = Router();

router.use(authenticate); // Apply authenticate middleware to all routes in this file

router.route("/stats").get(getChannelStats);
router.route("/videos").get(getChannelVideos);

export default router