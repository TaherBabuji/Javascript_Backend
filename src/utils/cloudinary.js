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
    console.log("old file path: ", oldLocalFilePath);

    function extractPublicId(url) {
      // Split the URL by '/'
      const parts = url.split("/");
      // Get the last part of the URL (which contains the filename and extension)
      const filename = parts.pop();
      // Remove the file extension to get the public ID
      const publicId = filename.split(".")[0];
      return publicId;
    }

    const publicId = extractPublicId(oldLocalFilePath);

    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });

    console.log("response: ", response);

    return response;
  } catch (error) {
    throw new ApiError(
      500,
      `Error while deleting old file from Cloudinary: ${error.message}`
    );
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
