import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return "localFilePath not found";
    //Upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    //file has been uploaded successfully
    // console.log("file is uploaded on cloudinary: ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); //remove the locally saved temporary file as the operation got failed.
    return null;
  }
};

const deleteFromCloudinary = async (oldLocalFilePath) => {
  try {
    if (!oldLocalFilePath) {
      return "old local file path not found while deleting old file";
    }

    const response = await cloudinary.uploader.destroy(oldLocalFilePath, {
      resource_type: "auto",
    });

    return response;
  } catch (error) {
    throw new ApiError(400, ("Error while deleting old file: ", error));
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
