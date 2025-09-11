import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { Comment } from "./comment.model.js";
import { Like } from "./like.model.js";
const videoSchema = new Schema(
  {
    videoFile: {
      type: String, //cloudinary url
      required: true,
    },
    thumbnail: {
      type: String, //cloudinary url
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

videoSchema.post("findOneAndDelete", async function (doc, next) {
  try {
    // Delete related comments
    await Comment.deleteMany({ video: doc._id });

    // Delete related likes
    await Like.deleteMany({ video: doc._id });

    next(); // Proceed with video deletion
  } catch (error) {
    console.error(error, "error in findOneAndDelete");
    next(error); // Pass errors to Mongoose
  }
});

videoSchema.plugin(mongooseAggregatePaginate);



export const Video = mongoose.model("Video", videoSchema);
