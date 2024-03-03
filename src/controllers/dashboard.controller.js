import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const getChannelStats = asyncHandler(async (req, res) => {
  //   const video = await Video.find({ owner: req.user?._id });

  const video = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $group: {
        _id: null,
        totalVideos: {
          $sum: 1,
        },
        totalViews: {
          $sum: "$views",
        },
        totalLikes: {
          $sum: { $size: "$likes" },
        },
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]);

  if (!video || video.length === 0) {
    throw new ApiError(400, "Video data not found while getting channel stats");
  }

  const subscriber = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $group: {
        _id: null,
        totalSubscribers: {
          $sum: 1,
        },
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]);

  if (!subscriber) {
    throw new ApiError(
      400,
      "Subscriber data not found while fetching channel stats"
    );
  }

  const data = {
    video,
    subscriber,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, data, "Channel stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find({
    owner: req.user?._id,
  });

  if (!videos) {
    throw new ApiError(
      400,
      "Something went wrong while finding videos of this user"
    );
  }

  if (videos.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, "Currently you haven't uploaded any videos"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "All videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
