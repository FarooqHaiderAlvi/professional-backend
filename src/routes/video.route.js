import { Router } from "express";
import { publishVideo, getAllVideos, getVideoById } from "../controllers/video.controller.js"
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/upload-video").post(
  verifyJWT,
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishVideo
);

router.route("/get-all-videos").get(
  verifyJWT,
  getAllVideos
);

router.route("/get-video/:videoId").get(
  verifyJWT,
  getVideoById
)

export default router;