import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js"
import { ObjectId } from "mongodb";
import { Comment } from "../models/comment.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { getVideoDurationInSeconds } from 'get-video-duration'
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params
  // const { page = 1, limit = 10 } = req.query

  const comments = await Comment.aggregate([
    {
      $match: {
        video: new ObjectId(`${videoId}`), // here i am sending it id as a string if i want to send id as a number now i need to do it like objectId.createFromHexString(videoId)
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
        content: 1,
        owner: 1,
        "userDetails.username": 1, // Include username from the users collection
        "userDetails.avatar": 1 // Include avatar from the users collection
      }
    }
  ])

  if (!comments) {
    throw new ApiError(500, 'Something went wrong')
  }
  console.log(comments)
  return res.status(200).json(new ApiResponse(200, comments, "comment added successfully!"))

})

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params
  const { content } = req.body

  const comment = await Comment.create({
    content: content,
    video: videoId,
    owner: req.user._id
  })

  if (!comment) {
    throw new ApiError(500, 'Something went wrong')
  }
  console.log(comment)
  return res.status(200).json(new ApiResponse(200, comment, "comment added successfully!"))

})

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
})

export {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment
}