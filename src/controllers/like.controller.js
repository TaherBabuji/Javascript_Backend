import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Please provide valid Video Id");
  }

  const oldLike = await Like.findOne({ video: videoId });

  if (oldLike) {
    await Like.findByIdAndDelete(oldLike._id);

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Unliked on a video"));
  }

  const like = await Like.create({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (!like) {
    throw new ApiError(500, "Something went wrong while liking on video");
  }

  return res.status(200).json(new ApiResponse(200, like, "Liked on a video"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(400, "Please provide valid comment Id");
  }

  const oldLike = await Like.findOne({ comment: commentId });

  if (oldLike) {
    await Like.findByIdAndDelete(oldLike._id);

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Unliked on a comment"));
  }

  const like = await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (!like) {
    throw new ApiError(500, "Something went wrong while liking on comment");
  }

  return res.status(200).json(new ApiResponse(200, like, "Liked on a comment"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Please provide valid tweet Id");
  }

  const oldLike = await Like.findOne({ tweet: tweetId });

  if (oldLike) {
    await Like.findByIdAndDelete(oldLike._id);

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Unliked on a tweet"));
  }

  const like = await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (!like) {
    throw new ApiError(500, "Something went wrong while liking the tweet");
  }

  return res.status(200).json(new ApiResponse(200, like, "Liked on a tweet"));
});

const getLikedVideos = asyncHandler(async (req, res) => {});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike };
