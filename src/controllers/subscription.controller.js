import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { match } from "assert";

const toggleSubscription = asyncHandler(async (req, res) => {
  console.log("toggle subscription");
  const { channelId } = req.params;
  const { isSubscribed } = req.body;
  const subscriberId = req.user._id;
  let subscription;
  if (isSubscribed) {
    subscription = await Subscription.create({
      subscriber: subscriberId,
      channel: channelId,
    });
  } else {
    subscription = await Subscription.deleteOne({
      subscriber: subscriberId,
      channel: channelId,
    });
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscription },
        `Subscription ${isSubscribed ? "added" : "removed"} successfully`
      )
    );
  // TODO: toggle subscription
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  const subscribers = await Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(subscriberId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribersList",
      },
    },
    {
      $unwind: {
        path: "$subscribersList",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        subscriber: "$subscriber",
        subscriberName: "$subscribersList.username",
        subscriberAvatar: "$subscribersList.avatar",
      },
    },
  ]);

  console.log(subscribers);
  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscriber of the channel fetched.")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  console.log(req.params);
  const { channelId } = req.params;
  const subscriptions = await Subscription.aggregate([
    {
      $match: { subscriber: new mongoose.Types.ObjectId(channelId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelsList",
      },
    },
    {
      $unwind: {
        path: "$channelsList",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        channel: "$channel",
        channelName: "$channelsList.username",
        channelAvatar: "$channelsList.avatar",
      },
    },
  ]);

  console.log(subscriptions);
  return res
    .status(200)
    .json(new ApiResponse(200, subscriptions, "Subscribed channels fetched."));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
