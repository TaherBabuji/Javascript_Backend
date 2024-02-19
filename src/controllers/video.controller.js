import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
  deleteVideoFromCloudinary,
} from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const pipeline = [];

  if (query) {
    pipeline.push({
      $search: {
        $index: "title_text_description_text",
        $text: {
          query: query,
          path: ["title", "description"],
        },
      },
    });
  }

  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid user id");
    }

    pipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    });
  }

  pipeline.push({
    $match: {
      isPublished: true,
    },
  });

  if (sortBy && sortType) {
    pipeline.push({
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    });
  } else {
    pipeline.push({
      $sort: { createdAt: -1 },
    });
  }

  let options = {
    page,
    limit,
  };

  const allVideo = await Video.aggregatePaginate(pipeline, options);

  return res
    .status(200)
    .json(new ApiResponse(200, allVideo, "All videos fetched"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "All fields are required");
  }

  const videoFileLocalPath = req.files.videoFile[0]?.path;
  const thumbnailLocalPath = req.files.thumbnail[0]?.path;

  console.log(videoFileLocalPath);

  if (!videoFileLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Video and thumbnail file is required");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile || !thumbnail) {
    throw new ApiError(400, "Video and thumbnail file is required");
  }

  const video = await Video.create({
    title,
    description,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    owner: req.user?._id,
    duration: videoFile.duration,
    isPublished: true,
  });

  const createdVideo = await Video.findById(video._id);

  if (!createdVideo) {
    throw new ApiError(401, "Something went wrong while adding a video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdVideo, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Please provide valid video Id");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "likes",
        foreignField: "video",
        localField: "_id",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "comments",
        foreignField: "video",
        localField: "_id",
        as: "comments",
        pipeline: [
          {
            $lookup: {
              from: "likes",
              foreignField: "comment",
              localField: "_id",
              as: "commentLikes",
            },
          },
          {
            $lookup: {
              from: "users",
              foreignField: "_id",
              localField: "owner",
              as: "commentOwner",
            },
          },
          {
            $addFields: {
              avatar: {
                $first: "$commentOwner.avatar",
              },
              username: {
                $first: "$commentOwner.username",
              },
              likesCount: {
                $size: "$commentLikes",
              },
            },
          },
          {
            $project: {
              username: 1,
              avatar: 1,
              content: 1,
              likesCount: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "owner",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              foreignField: "channel",
              localField: "_id",
              as: "subscribers",
            },
          },

          {
            $addFields: {
              subscribersCount: {
                $size: "$subscribers",
              },

              isSubscribed: {
                $cond: {
                  if: {
                    $in: [req.user?._id, "$subscribers.subscriber"],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              avatar: 1,
              subscribersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        commentsCount: {
          $size: "$comments",
        },
        owner: {
          $first: "$owner",
        },
        isLiked: {
          $cond: {
            if: {
              $in: [req.user?._id, "$likes.likedBy"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        videoFile: 1,
        title: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        published: 1,
        duration: 1,
        commentsCount: 1,
        comments: 1,
        owner: 1,
        likesCount: 1,
        isLiked: 1,
      },
    },
  ]);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  await Video.findByIdAndUpdate(
    videoId,
    {
      $inc: { views: 1 },
    },
    {
      new: true,
    }
  );

  const user = await User.findById(req.user?._id).select("watchHistory");

  user.watchHistory.push(videoId);
  await user.save();

  const updatedVideo = {
    video,
    watchHistory: user.watchHistory,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Please provide valid video Id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  if (req.user._id != video.owner.toString()) {
    throw new ApiError(
      400,
      "You are not the owner of this video, please login as owner first to update this video"
    );
  }

  const { title, description } = req.body;

  const thumbnailLocalPath = req.file?.path;

  if (!title && !description && !thumbnailLocalPath) {
    throw new ApiError(
      400,
      "Please provide at least one field to update your video"
    );
  }

  let thumbnail;
  if (thumbnailLocalPath && thumbnailLocalPath.length !== 0) {
    const oldThumbnailLocalPath = video.thumbnail;

    thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail) {
      throw new ApiError(401, "Error while uploading thumbnail");
    }

    await deleteFromCloudinary(oldThumbnailLocalPath);
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      title,
      description,
      thumbnail: thumbnail?.url,
    },
    {
      new: true,
    }
  );

  if (!updatedVideo) {
    throw new ApiError(500, "Failed to update video please try again later");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Please provide valid video Id");
  }

  const oldVideo = await Video.findById(videoId);

  if (!oldVideo) {
    throw new ApiError(400, "Video not found");
  }

  if (oldVideo.owner.toString() != req.user._id) {
    throw new ApiError(
      402,
      "You are not the owner of this video, Please login as owner first to delete this video"
    );
  }

  await deleteVideoFromCloudinary(oldVideo.videoFile);
  await deleteFromCloudinary(oldVideo.thumbnail);

  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Please provide valid video Id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(402, "Video not found");
  }

  if (video.owner.toString() != req.user._id) {
    throw new ApiError(
      400,
      "You are not the owner of this video, Please login as owner first to toggle publish status"
    );
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      isPublished: video.isPublished ? false : true,
    },
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(
      401,
      "Failed to toggle publish status, please try again later"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "Publish status updated successfully")
    );
});

export {
  publishAVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
