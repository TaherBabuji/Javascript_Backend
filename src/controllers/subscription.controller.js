import { Subscription } from "../models/subscription.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";
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

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiError(400, "Please provide valid channel Id");
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(400, "Channel not found");
  }

  const channelSubscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "subscriber",
        as: "subscribers",
      },
    },
    {
      $unwind: "$subscribers",
    },
    {
      $group: {
        _id: null,
        subscribers: {
          $push: {
            _id: "$subscribers._id",
            email: "$subscribers.email",
            fullName: "$subscribers.fullName",
            avatar: "$subscribers.avatar",
            coverImage: "$subscribers.coverImage",
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        subscribers: 1,
      },
    },
  ]);

  if (!channelSubscribers) {
    throw new ApiError(
      500,
      "Something went wrong while fetching channel subscribers"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channelSubscribers[0],
        "Channel subscribers fetched successfully"
      )
    );
});

const getSubscribedChannel = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!subscriberId || !isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Please provide valid subscriber Id");
  }

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "channel",
        as: "channels",
      },
    },
    {
      $unwind: "$channels",
    },
    {
      $group: {
        _id: null,
        channels: {
          $push: {
            _id: "$channels._id",
            username: "$channels.username",
            avatar: "$channels.avatar",
            coverImage: "$channels.coverImage",
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        channels: 1,
      },
    },
  ]);

  if (!subscribedChannels) {
    throw new ApiError(
      500,
      "Something went wrong while fetching subscribed channels"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "Subscribed channels fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannel };
