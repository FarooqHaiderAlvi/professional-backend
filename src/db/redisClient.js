import redis from "redis";

const redisClient = redis.createClient({
  // url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => console.error("Redis Error:", err));
redisClient.on("connect", () => console.log("Redis client connected"));
redisClient.on("ready", () => console.log("Redis client ready"));

await redisClient.connect();

export default redisClient;