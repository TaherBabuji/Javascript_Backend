import express from "express";
import {
  addComment,
  getVideoComments,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(verifyJWT);

router.route("/getVideoComments/:videoId").get(getVideoComments);
router.route("/addComment/:videoId").post(addComment);

export default router;
