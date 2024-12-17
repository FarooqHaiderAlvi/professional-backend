import { Router } from "express";
import { addComment, getVideoComments } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/add-comment/:videoId").post(
  verifyJWT,
  addComment
);

router.route("/get-comments/:videoId").get(
  verifyJWT,
  getVideoComments
);

export default router;
