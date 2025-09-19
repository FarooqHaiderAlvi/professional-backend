import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.model.js";

console.log("✅ Passport Google Strategy loading...");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("🔑 Google Profile received:", {
        id: profile.id,
        email: profile.emails?.[0]?.value,
        name: profile.displayName,
      });

      try {
        console.log('myprofile', profile)
        let user = await User.findOne({ email: profile.emails[0].value });
        if (!user) {
          console.log("🆕 Creating new user:", profile.emails[0].value);
          user = await User.create({
            fullName: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0]?.value || "",
            username: profile.emails[0].value.split("@")[0],
            password: Math.random().toString(36).slice(-8),
          });
        } else {
          console.log("🙋 Existing user found:", user.email);
        }
        return done(null, user);
      } catch (err) {
        console.error("❌ Error in GoogleStrategy:", err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("🗂 serializeUser:", user.id);
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  console.log("📂 deserializeUser:", user?.email);
  done(null, user);
});
