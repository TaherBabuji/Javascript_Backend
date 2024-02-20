import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
// import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(401, "Please provide valid video Id");
  }

  const options = {
    page,
    limit,
  };

  const comments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "owner",
        as: "owner",
      },
    },
    {
      $lookup: {
        from: "likes",
        foreignField: "comment",
        localField: "_id",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $project: {
        "owner.username": 1,
        "owner.avatar": 1,
        likesCount: 1,
        content: 1,
      },
    },
  ]);

  if (!comments) {
    throw new ApiError(
      400,
      "Something went wrong while fetching all comments of this video"
    );
  }

  if (comments.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, comments, "No comments found for this video"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Please provide valid video Id");
  }

  const { content } = req.body;

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

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(400, "Please provide valid comment Id");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, "Comment not found");
  }

  if (comment.owner.toString() != req.user._id) {
    throw new ApiError(
      400,
      "You are not the owner of this comment, please sign in as owner to update this comment"
    );
  }

  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          null,
          "You have to provide some content to update the comment"
        )
      );
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      content,
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(400, "Please provide valid comment Id");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, "Comment not found");
  }

  if (comment.owner.toString() != req.user._id) {
    throw new ApiError(
      400,
      "You are not the owner of this comment, please sign in as owner to delete this comment"
    );
  }

  await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment deleted successfully"));
});

export { addComment, getVideoComments, updateComment, deleteComment };
