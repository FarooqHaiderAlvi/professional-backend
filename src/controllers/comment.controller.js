import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js"
import { ObjectId } from "mongodb";
import { Comment } from "../models/comment.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";


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
  return res.status(200).json(new ApiResponse(200, comments, "comments fetched successfully!"))

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
  const { commentId } = req.params;
  const { content } = req.body;

  const comment = await Comment.findById(commentId);

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to update this comment');
  }

  const updatedComment = await Comment.findByIdAndUpdate(commentId, { content: content }, { new: true })

  if (!updatedComment) {
    throw new ApiError(500, 'Something went wrong')
  }
  console.log(comment)
  return res.status(200).json(new ApiResponse(200, updatedComment, "comment updated successfully!"))
})

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  console.log(comment.owner, req.user._id)
  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to delete this comment');
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if (!deletedComment) {
    throw new ApiError(500, 'Something went wrong')
  }
  console.log(deletedComment)
  return res.status(200).json(new ApiResponse(200, deletedComment, "comment deleted successfully!"))
})

export {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment
}