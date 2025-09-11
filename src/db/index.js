import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { cacheWatcher } from "./invalidateCache.js";
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(`ConnectionInstance:: ${connectionInstance.connection.host}`);
    cacheWatcher();
  } catch (error) {
    console.log("Mongodb connection error ", error);
  }
};

export default connectDB;
