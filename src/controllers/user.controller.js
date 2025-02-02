import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
const generateTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  console.log("in register user");
  const { username, fullName, password, email } = req.body;
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const userExist = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (userExist) {
    throw new ApiError(400, "User with email or username already existed.");
  }
  console.log(userExist, "i am user", req.files);

  const avatarPath = req.files?.avatar[0]?.path;
  const coverImagePath = req.files?.coverImage[0]?.path;

  if (!avatarPath) {
    throw new ApiError(400, "avatar field is required.");
  }
  const avatar = await uploadOnCloudinary(avatarPath);
  console.log("avatar uploaded");
  const coverImage = await uploadOnCloudinary(coverImagePath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required.");
  }

  const user = await User.create({
    fullName,
    avatar: avatar?.url || "",
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // const createdUser = await User.findById(user._id).select(
  //   "-password -refreshToken"
  // );
  const createdUser = await generateTokens(user._id);
  if (!createdUser) {
    throw new ApiError(500, "Somethign went wrong...");
  }
  console.log(createdUser);
  console.log("user is created");
  res.cookie("access_token", createdUser.accessToken, {
    httpOnly: false, // Prevent JavaScript access
    sameSite: "lax", // Default for most use cases in dev
    maxAge: 5 * 60 * 60 * 1000, // 1-day expiry
    secure: true, // Allow HTTP during development for localhost otherwise cookie will not be
    path: "/", // Ensure cookie is accessible site-wide
  });
  res.cookie("refresh_token", createdUser.refreshToken, {
    httpOnly: true, // Prevent JavaScript access
    sameSite: "lax", // Default for most use cases in dev
    maxAge: 24 * 60 * 60 * 1000, // 1-day expiry
    secure: true, // Allow HTTP during development for localhost otherwise cookie will not be
    path: "/", // Ensure cookie is accessible site-wide
  });

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User created Successfully."));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!(email || username)) {
    throw new ApiError(400, "Username and password is required.");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(400, "User does not exist");
  }

  const isValidPass = await user.isPasswordCorrect(password);
  if (!isValidPass) {
    throw new ApiError(400, "Invalid credentials.");
  }
  const { accessToken, refreshToken } = await generateTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  const decoded = jwt.decode(accessToken); // Decode the token (no signature check)
  console.log("Decoded Token:", decoded);
  return res
    .status(200)
    .cookie("access_token", accessToken, options)
    .cookie("refresh_token", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "user LoggedIn successfully!"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  console.log("i have reached here in debugging.");
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out."));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingToken) {
    throw new ApiError(401, "Unauthorized request.");
  }

  const decodedToken = jwt.verify(
    incomingToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  const user = await User.findById(decodedToken._id);
  if (!user) {
    throw new ApiError(401, "Unauthorized request.");
  }

  if (incomingToken !== user.refreshToken) {
    throw new ApiError(401, "Refresh Token is expired");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  const { accessToken, newRefreshToken } = await generateTokens(user._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          accessToken,
          refreshToken: newRefreshToken,
        },
        "Access Token refreshed"
      )
    );
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confPassword } = req.body;

  if (newPassword !== confPassword) {
    return new ApiError(400, "Password doesn't match.");
  }

  const user = await User.findById(req.user._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    return new ApiError(400, "wrong Password");
  }

  user.password = newPassword;

  try {
    await user.save({ validationBeforeSave: false });
    return res
      .status(200)
      .json(new ApiResponse(200, true, "Password changed successfully"));
  } catch (err) {
    throw new ApiError(500, err);
  }
});

const getLoggedInUser = asyncHandler(async (req, res) => {
  const createdUser = await generateTokens(req.user._id);
  if (!createdUser) {
    throw new ApiError(500, "Somethign went wrong...");
  }
  console.log(createdUser);
  console.log("user is created");
  res.cookie("access_token", createdUser.accessToken, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 5 * 60 * 60 * 1000,
    secure: true,
    path: "/",
  });
  res.cookie("refresh_token", createdUser.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
    secure: true,
    path: "/",
  });

  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully."));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    return new ApiError(400, "name and email required");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { fullName, email },
    },
    { new: true }
  ).select("-password");

  res
    .status(200)
    .json(new ApiResponse(200, user, "user updated successfully."));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    return new ApiError(400, "Avatar file is missing.");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    return new ApiResponse(400, "Error while uploading on Avatar.");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { avatar: avatar.url },
    },
    { new: true } //  «Boolean» if true, return the modified document rather than the original
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User cover Image updated successfully."));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    return new ApiError(400, "Cover image file is missing.");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    return new ApiResponse(400, "Error while uploading on Avatar.");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { coverImage: coverImage.url },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User cover Image updated successfully."));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username,
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        channelSubscribedTo: { $size: "$subscribedTo" },
        isSubscribed: {
          $cond: {
            if: {
              $in: [
                new mongoose.Types.ObjectId(req.user._id),
                "$subscribers.subscriber",
              ],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelSubscribedTo: 1,
        avatar: 1,
        coverImage: 1,
        isSubscribed: 1,
        email: 1,
        // subscribers: 1,
      },
    },
  ]);

  if (!channel) {
    throw new ApiError(400, "channel not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "channel fetched Successfully."));
});

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },

    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    avatar: 1,
                    fullName: 1,
                    email: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "watch History fetched Successfully"
      )
    );
});

const addVideoToWatchHistory = asyncHandler(async (req, res) => {
  console.log("i am in add video to watch history");
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "videoId is required.");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $addToSet: { watchHistory: videoId },
    },
    { new: true }
  );

  if (!user) {
    throw new ApiError(500, "Something went wrong.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, user.watchHistory, "Video added to watch history.")
    );
});

const errorHandler = (err, req, res, next) => {
  console.log("error", err);
  throw new ApiError(err.code || 500, err.message || "Something went wrong.");
};

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changePassword,
  getLoggedInUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getUserWatchHistory,
  addVideoToWatchHistory,
  errorHandler,
};
