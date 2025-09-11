import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import redisClient from "../db/redisClient.js";

export const cacheWatcher = async () => {
  try {
    const collections = [
      { model: Video, redisKey: "all_videos" },
      { model: Comment, redisKey: "video-comments-*" },
      // add more models here...
    ];

    collections.forEach(({ model, redisKey }) => {
      const changeStream = model.watch();

      changeStream.on("change", async (change) => {
        console.log(`${model.modelName} changed:`, change.operationType);

        // Invalidate Redis cache for this collection
        // If using wildcard, fetch keys first
        if (redisKey.includes("*")) {
          const keys = await redisClient.keys(redisKey);
          if (keys.length > 0) {
            await redisClient.del(keys);
            console.log(`❌ Cache invalidated for ${redisKey}`);
          }
        } else {
          await redisClient.del(redisKey);
          console.log(`❌ Cache invalidated for ${redisKey}`);
        }
      });

      changeStream.on("error", (err) => {
        console.error(`Watcher error on ${model.modelName}:`, err);
      });

      console.log(`${model.modelName} watcher set up ✅`);
    });
  } catch (error) {
    console.error("Error setting up cache watchers:", error);
  }
};
