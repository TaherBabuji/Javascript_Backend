import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/uploadAVideo").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishAVideo
);
router.route("/getAllVideos").get(getAllVideos);
router.route("/getVideoById/:videoId").get(getVideoById);
router
  .route("/updateVideo/:videoId")
  .patch(upload.single("thumbnail"), updateVideo);
router.route("/deleteVideo/:videoId").delete(deleteVideo);
router.route("/togglePublishStatus/:videoId").patch(togglePublishStatus);

export default router;
