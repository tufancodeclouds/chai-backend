import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js"
import {authenticate} from "../middlewares/authenticate.middleware.js"

const router = Router();
router.use(authenticate); // Apply authenticate middleware to all routes in this file

router.route("/").post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router