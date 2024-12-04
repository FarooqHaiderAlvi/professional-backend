import { Router } from "express";
import {
  changePassword,
  getLoggedInUser,
  getUserChannelProfile,
  getUserWatchHistory,
  logOutUser,
  loginUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logOutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").patch(verifyJWT, changePassword);

router.route("/get-user").get(verifyJWT, getLoggedInUser);

router.route("/update-account-details").patch(verifyJWT, updateAccountDetails);

router
  .route("/update-avatar")
  .post(verifyJWT, upload.single("avatar"), updateAvatar);

router
  .route("/update-cover-image")
  .post(verifyJWT, upload.single("coverImage"), updateCoverImage);

router
  .route("/user-channel-profile/:username")
  .get(verifyJWT, getUserChannelProfile);

router.route("/history").get(verifyJWT, getUserWatchHistory);

export default router;
