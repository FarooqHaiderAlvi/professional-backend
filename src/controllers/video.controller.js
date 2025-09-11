import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getVideoDurationInSeconds } from "get-video-duration";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import redisClient from "../db/redisClient.js";
const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if ([title, description].some((field) => field?.trim() === "")) {
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
  console.log("video uploaded");
  const thumbnail = await uploadOnCloudinary(thumbnailPath);
  console.log("thumbnail uploaded");

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
  const cacheKey = "all_videos"; // could make it dynamic with query params

  // 1. Try cache
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    console.log("Cache hit ✅");
    return res
      .status(200)
      .json(new ApiResponse(200, JSON.parse(cached), "All videos fetched (cache)."));
  }

  console.log("Cache miss ❌ — querying MongoDB");

  // 2. Query MongoDB
  const videos = await Video.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        title: 1,
        videoFile: 1,
        thumbnail: 1,
        duration: 1,
        description: 1,
        views: 1,
        "userDetails.username": 1,
        "userDetails.avatar": 1,
      },
    },
  ]);

  if (!videos) throw new ApiError(500, "Something went wrong");

  // 3. Save to cache (with TTL e.g. 60 seconds)
  await redisClient.set(cacheKey, JSON.stringify(videos), { EX: 60 });

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "All videos fetched (DB)."));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  console.log("iam in get video id");
  console.log(videoId);
  const cacheKey = videoId; // could make it dynamic with query params

  // 1. Try cache
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    console.log("Cache hit for single video ✅");
    return res
      .status(200)
      .json(new ApiResponse(200, JSON.parse(cached), "video fetched."));
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new ObjectId(`${videoId}`), // here i am sending it id as a string if i want to send id as a number now i need to do it like objectId.createFromHexString(videoId)
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $unwind: {
        path: "$userDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        videoFile: 1,
        thumbnail: 1,
        duration: 1,
        description: 1,
        views: 1,

        "userDetails.username": 1, // Include username from the users collection
        "userDetails.avatar": 1, // Include avatar from the users collection
      },
    },
  ]);

  if (!video) {
    throw new ApiError(500, "Something went wrong");
  }
  await redisClient.set(cacheKey, JSON.stringify(video), { EX: 60 });
  return res.status(200).json(new ApiResponse(200, video, "video fetched."));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this video");
  }

  if ([title, description].some((field) => field?.trim() === "")) {
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
  console.log("video uploaded");
  const thumbnail = await uploadOnCloudinary(thumbnailPath);
  console.log("thumbnail uploaded");

  if (!videoFile || !thumbnail) {
    throw new ApiError(400, "Oops! something went wrong");
  }
  const tempVideo = video.videoFile;
  const tempThumbnail = video.thumbnail;

  const updatedVideo = await Video.findOneAndUpdate(
    { _id: videoId }, // Filter condition
    {
      $set: {
        videoFile: videoFile?.url || tempVideo,
        thumbnail: thumbnail?.url || tempThumbnail,
        title: title,
        description: description,
        duration: duration,
      },
    },
    { new: true } // Return the updated document
  );

  if (updatedVideo.videoFile !== tempVideo) {
    deleteFromCloudinary(tempVideo, "video");
  }
  if (updatedVideo.thumbnail !== tempThumbnail) {
    deleteFromCloudinary(tempThumbnail, "image");
  }

  if (!updatedVideo) {
    throw new ApiError(500, "Somethign went wrong...");
  }

  console.log("Video uploaded");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated Successfully."));

  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }

  const tempvideoFile = video.videoFile;
  const thumbnail = video.thumbnail;

  const deletedVideo = await Video.findOneAndDelete({ _id: videoId });
  if (!deletedVideo) {
    throw new ApiError(404, "Video not found");
  }
  console.log("video deleted");
  deleteFromCloudinary(tempvideoFile, "video");
  deleteFromCloudinary(thumbnail, "image");

  return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video deleted Successfully."));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
