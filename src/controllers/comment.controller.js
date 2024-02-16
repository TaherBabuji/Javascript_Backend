import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Please provide valid video Id");
  }

  const content = req.body;

  if (!content) {
    throw new ApiError(
      401,
      "You have to add some content to comment on this video"
    );
  }

  const comment = await Comment.create({
    video: videoId,
    content,
    owner: req.user?._id,
  });

  if (!comment) {
    throw new ApiError(
      500,
      "Something went wrong while commenting on this video, please try again later"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, comment, "Successfully added comment on this video")
    );
});

export { addComment };
