import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "Please provide some content to post a tweet");
  }

  const tweet = await Tweet.create({
    owner: req.user?._id,
    content,
  });

  if (!tweet) {
    throw new ApiError(500, "Something went wrong while posting a tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet successfully created"));
});

export { createTweet };
