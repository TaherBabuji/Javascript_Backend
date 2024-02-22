import express from "express";
import {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.route("/toggleVideoLike/:videoId").post(toggleVideoLike);
router.route("/toggleCommentLike/:commentId").post(toggleCommentLike);
router.route("/toggleTweetLike/:tweetId").post(toggleTweetLike);

export default router;
