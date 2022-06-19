const bcrypt = require('bcryptjs');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const User = require('../model/user');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, cb) => {
      // 驗證使用者是否已存在
      const user = await User.findOne({ googleAuthID: profile.id });
      if (user) {
        return cb(null, user);
      }
      // 若使用者不存在，建立新使用者
      // 建立一個隨機密碼
      const password = await bcrypt.hash(
        process.env.RANDOM_GOOGLE_PASSWORD,
        12
      );
      const newUser = await User.create({
        googleAuthID: profile.id,
        name: profile._json.name,
        email: profile._json.email,
        avatar: profile._json.picture,
        password,
      });
      return cb(null, newUser);
    }
  )
);
