import { asyncHandler } from "../utils/asyncHandler.js";
import { generateTokens } from "./user.controller.js";

const googleAuth = asyncHandler(async (req, res, next) => {
  console.log("✅ Google auth successful, user:", req.user?.email);

  const { accessToken, refreshToken } = await generateTokens(req.user._id);

  res.cookie("access_token", accessToken, { httpOnly: false, secure: true, sameSite: "lax", path: "/" });
  res.cookie("refresh_token", refreshToken, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });

  console.log("↪️ Redirecting user to frontend:", process.env.CLIENT_URL || "http://localhost:5173");
  res.redirect(process.env.CLIENT_URL || "http://localhost:5173");
})


export {
  googleAuth
}