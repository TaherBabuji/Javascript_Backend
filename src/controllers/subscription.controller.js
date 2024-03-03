import { Subscription } from "../models/subscription.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiError(400, "Please provide valid Channel Id");
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(400, "No channel founded on given Id");
  }

  const oldSubscription = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });

  if (oldSubscription) {
    await Subscription.findByIdAndDelete(oldSubscription._id);
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Channel unsubscribed successfully"));
  }

  const subscription = await Subscription.create({
    subscriber: req.user?._id,
    channel: channelId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscription, "Channel subscribed successfully")
    );
});

export { toggleSubscription };
