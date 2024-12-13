import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getVideoDurationInSeconds } from 'get-video-duration'
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (
    [title, description].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const videoFilePath = req.files?.videoFile[0]?.path;
  const thumbnailPath = req.files?.thumbnail[0]?.path;

  if (!videoFilePath || !thumbnailPath) {
    throw new ApiError(400, "video and thumbnail required");
  }

  //get video duration 
  const duration = Math.floor(await getVideoDurationInSeconds(videoFilePath));

  const videoFile = await uploadOnCloudinary(videoFilePath);
  console.log('video uploaded');
  const thumbnail = await uploadOnCloudinary(thumbnailPath);
  console.log('thumbnail uploaded')

  if (!videoFile || !thumbnail) {
    throw new ApiError(400, "Oops! something went wrong");
  }


  const video = await Video.create({
    videoFile: videoFile?.url || "",
    thumbnail: thumbnail?.url || "",
    title,
    description,
    duration,
    owner: req.user._id,
  });

  if (!video) {
    throw new ApiError(500, "Somethign went wrong...");
  }
  console.log(video);
  console.log("Video uploaded");

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video uploaded Successfully."));
});

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
  //TODO: get all videos based on query, sort, pagination
})

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params
})

export {
  getAllVideos,
  publishVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus
}