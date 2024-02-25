import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createTweet,
  deleteTweet,
  getUserTweet,
  updateTweet,
} from "../controllers/tweet.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/createTweet").post(createTweet);

router.route("/getUserTweet/:userId").get(getUserTweet);

router.route("/updateTweet/:tweetId").patch(updateTweet);

router.route("/deleteTweet/:tweetId").delete(deleteTweet);

export default router;
