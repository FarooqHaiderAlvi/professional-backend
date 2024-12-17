import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getVideoDurationInSeconds } from 'get-video-duration'
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";


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
  // const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
  //TODO: get all videos based on query, sort, pagination

  const videos = await Video.aggregate([
    {
      // Perform a lookup to join with the users collection
      $lookup: {
        from: "users", // The name of the users collection
        localField: "owner", // The field in videos containing the user's _id
        foreignField: "_id", // The field in users to match the _id
        as: "userDetails" // The resulting field where user data will be added
      }
    },
    {
      // Unwind the userDetails array to get individual objects
      $unwind: {
        path: "$userDetails",
        preserveNullAndEmptyArrays: true // In case there's no matching user, keep the video
      }
    },
    {
      // Project the fields you want in the final output
      $project: {
        _id: 1, // Include the video ID
        title: 1, // Include the title from the videos collection
        videoFile: 1, // Include the video URL
        thumbnail: 1,
        duration: 1,
        description: 1,
        views: 1,

        "userDetails.username": 1, // Include username from the users collection
        "userDetails.avatar": 1 // Include avatar from the users collection
      }
    }
  ]);

  console.log('...video', videos, '...end')

  if (!videos) {
    throw new ApiError(500, "Something went wrong");
  }

  //return all videos
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "All videos fetched."));

})

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  console.log('iam in get video id')
  console.log(videoId)
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
        as: "userDetails"
      }
    },
    {

      $unwind: {
        path: "$userDetails",
        preserveNullAndEmptyArrays: true
      }
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
        "userDetails.avatar": 1 // Include avatar from the users collection
      }
    }
  ])

  if (!video) {
    throw new ApiError(500, "Something went wrong");
  }

  return res.status(200).json(new ApiResponse(200, video, "video fetched."))

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