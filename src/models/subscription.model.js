import mongoose, { Schema } from "mongoose";
import { removeAllListeners } from "nodemon";

const subscriptionSchema = new mongoose.Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
// to select all subscribers of a channel, i will
//count the no of that channels in the subscription model
//suppose we have three subscribers, and 3 channesl
// sub=x,y,z
// channel=c1,c2,3

// doc1=ch:c1,sub:x;
// doc2=ch:c2,sub:y
// so total subscribers will be get by getting
// no of channel appear in the table
