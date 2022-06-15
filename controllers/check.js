const successHandler = require('../helper/successHandlers');
const appError = require('../helper/appError');
const jwt = require('jsonwebtoken');

const CheckController = {
  async checkToken(req, res, next) {
    // 驗證 token 是否存在
    let token;
    const AUTH = req.headers.authorization;
    if (AUTH && AUTH.startsWith('Bearer')) {
      token = AUTH.split(' ')[1];
    }

    if (!token) {
      return appError(
        401,
        'Unauthorized Error - lacks valid authentication credentials',
        next
      );
    }

    // 驗證 token 正確性
    const decode = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) {
          reject(err);
        } else {
          resolve(payload);
        }
      });
    });

    // 查詢資料庫中是否有相對應的 user 資料
    await User.findById(decode.id)
      .then(() => {
        successHandler(res, req);
      })
      .catch(() => appError(400, 'Bad Request Error - ID not found', next));

    next();
  },
};

module.exports = CheckController;
