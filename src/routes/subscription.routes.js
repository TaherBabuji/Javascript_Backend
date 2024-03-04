import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannel,
} from "../controllers/subscription.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/toggleSubscription/:channelId").post(toggleSubscription);
router
  .route("/getUserChannelSubscribers/:channelId")
  .get(getUserChannelSubscribers);
router.route("/getSubscribedChannels/:subscriberId").get(getSubscribedChannel);

export default router;
