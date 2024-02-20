import express from "express";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(verifyJWT);

router.route("/getVideoComments/:videoId").get(getVideoComments);
router.route("/addComment/:videoId").post(addComment);
router.route("/updateComment/:commentId").patch(updateComment);
router.route("/deleteComment/:commentId").delete(deleteComment);

export default router;
