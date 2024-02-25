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

const getUserTweet = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(400, "Please provide valid user Id");
  }

  const tweet = await Tweet.find({ owner: userId });

  if (!tweet) {
    throw new ApiError(400, "Something went wrong while fetching tweets");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "User's tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Please provide valid tweet Id");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "Cannot find tweet");
  }

  if (req.user?._id != tweet.owner.toString()) {
    throw new ApiError(
      400,
      "You are not the owner of this tweet, Please login as owner to update this tweet"
    );
  }

  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    throw new ApiError(
      400,
      "You have to provide some content to update your tweet"
    );
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      content,
    },
    { new: true }
  );

  if (!updatedTweet) {
    throw new ApiError(500, "Something went wrong while updating tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Please provide valid tweet Id");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "Cannot find tweet");
  }

  if (req.user?._id != tweet.owner.toString()) {
    throw new ApiError(
      400,
      "You are not the owner of this tweet, Please login as owner to delete this tweet"
    );
  }

  await Tweet.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Tweet deleted successfully"));
});

export { createTweet, getUserTweet, updateTweet, deleteTweet };
