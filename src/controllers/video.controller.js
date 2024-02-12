import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

export { publishAVideo };
