const express = require('express');
const router = express.Router();
const asyncErrorHandler = require('../helper/asyncErrorHandler');
const { isAuth } = require('../helper/auth');
const CheckController = require('../controllers/check');

// 前台：User - 使用者
router.get(
  '/',
  /**
   * #swagger.tags = ['Token 驗證']
   * #swagger.description = '驗證 token 正確與否 API'
   * #swagger.security = [{ "bearerAuth": [] }]
   */
  isAuth,
  asyncErrorHandler(CheckController.checkToken)
);

module.exports = router;
