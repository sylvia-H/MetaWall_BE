const express = require('express');
const router = express.Router();
const asyncErrorHandler = require('../helper/asyncErrorHandler');
const { isAuth} = require('../helper/auth');
const checkController = require('../controllers/check');

// 前台：User - 使用者
router.post(
  '/',
  /**
   * #swagger.tags = ['Token 驗證']
   * #swagger.description = '驗證 token 正確與否 API'
   * #swagger.security = [{ "bearerAuth": [] }]
   * #swagger.parameters['authorization'] = {
      in: 'header',
      description: 'JSON Web Token',
      schema: {
        $Authorization: '',
      }
    }
   */
  asyncErrorHandler(checkController.checkToken)
);

module.exports = router;