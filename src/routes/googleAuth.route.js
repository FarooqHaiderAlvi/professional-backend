import { Router } from 'express';
import '../utils/passport.js';
import { googleAuth } from '../controllers/googleAuth.controller.js';
import passport from 'passport';


const router = Router();


router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.route("/google/callback").get(
  (req, res, next) => {
    console.log("⬅️ Google redirected back to /auth/google/callback");
    next();
  },
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  googleAuth
);

export default router;