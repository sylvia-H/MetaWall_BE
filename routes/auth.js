const express = require('express');
const router = express.Router();
const asyncErrorHandler = require('../helper/asyncErrorHandler');
const successHandler = require('../helper/successHandlers');
const passport = require('passport');

router.get(
  '/google',
  /**
   * #swagger.tags = ['Google 第三方登入']
   * #swagger.description = 'Google 第三方登入 Passport API'
   */
  asyncErrorHandler(
    passport.authenticate('google', {
      scope: ['email', 'profile'],
    })
  )
);

router.get(
  '/google/callback',
  /**
   * #swagger.tags = ['Google 第三方登入 callback function']
   * #swagger.description = 'Google 第三方登入 Passport callback function'
   */
  passport.authenticate('google', { session: false }),
  (req, res) => {
    generateJWTToken(req.user, 201, res);
  }
);

module.exports = router;
