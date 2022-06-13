const successHandler = require('../helper/successHandlers');
const appError = require('../helper/appError');
const { generateJWTToken } = require('../helper/auth');
const User = require('../model/user');
const { json } = require('express');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const UserController = {
  async signUp(req, res) {
    let { name, email, password } = req.body;
    // 欄位不可為空
    if (!name || !email || !password) {
      return appError(
        400,
        'Bad Request Error - All required fields must be completed.',
        next
      );
    }
    // 密碼需 8 碼以上
    if (!validator.isLength(password, { min: 8 })) {
      return appError(
        400,
        'Bad Request Error - Password must be at least 8 characters in length.',
        next
      );
    }
    //  是否符合 email 格式
    if (!validator.isEmail(email)) {
      return appError(
        400,
        'Bad Request Error - E-mail address has invalid format.',
        next
      );
    }
    // 加密密碼
    password = await bcrypt.hash(password, 12);
    const newUser = await User.create({ name, email, password });
    generateJWTToken(newUser, 201, res);
  },
  async signIn(req, res) {
    const { email, password } = req.body;
    // 欄位不可為空
    if (!email || !password) {
      return appError(
        400,
        'Bad Request Error - All required fields must be completed.',
        next
      );
    }
    // 從資料庫中撈出使用者資訊 & 取出密碼
    const user = await User.findOne({ email }, (err, user) => {
      if (err) {
        return appError(
          400,
          'Bad Request Error - The email or password is incorrect.',
          next
        );
      }
      next();
    }).select('+password');
    // 比對密碼
    const auth = await bcrypt.compare(password, user.password);
    if (!auth) {
      return appError(
        400,
        'Bad Request Error - The password is incorrect.',
        next
      );
    }
    generateJWTToken(user, 200, res);
  },
  async updatePassword(req, res, next) {
    const { password, confirmPassword } = req.body;
    // 兩次輸入密碼是否一致
    if (password !== confirmPassword) {
      return appError(
        400,
        'Bad Request Error - The two passwords must be consistent!',
        next
      );
    }
    // 產生新的加密密碼
    const newPassword = await bcrypt.hash(password, 12);
    // 更新密碼 & 回傳新 token
    await User.findByIdAndUpdate(req.user._id, { password: newPassword })
      .then((userData) => {
        if (!userData) {
          return appError(400, 'Bad Request Error - Failed to get data', next);
        }
        generateJWTToken(userData, 200, res);
      })
      .catch(() => appError(400, 'Bad Request Error - ID not found', next));
  },
  async getProfile(req, res, next) {
    if (!req.user) {
      return appError(400, 'Bad Request Error - Failed to get data.', next);
    }
    successHandler(res, req.user);
  },
  async editProfile(req, res, next) {
    if (!req.user) {
      return appError(401, 'Bad Request Error - Please login again.', next);
    }
    if (!req.body) {
      return appError(
        400,
        'Bad Request Error - Required information not filled.',
        next
      );
    }
    const { name, sex, avatar } = req.body;
    // 更新暱稱 & 性別
    await User.findByIdAndUpdate(req.user._id, { name, sex, avatar })
      .then((userData) => {
        if (!userData) {
          return appError(400, 'Bad Request Error - Failed to get data', next);
        }
        successHandler(res, userData);
      })
      .catch(() => appError(400, 'Bad Request Error - ID not found', next));
  },
  async followList(req, res, next) {
    const id = req.user._id;
    const followList = await User.findById(id, 'following').populate({
      path: 'following.user',
      select: '_id name avatar',
    });
    successHandler(res, followList);
  },
  async follow(req, res, next) {
    // 不能追蹤自己
    if (req.params.id === req.user._id) {
      return appError(
        401,
        'Bad Request Error - Failed to follow yourself.',
        next
      );
    }
    await User.updateOne(
      {
        _id: req.user._id,
        'following.user': { $ne: req.params.id },
      },
      {
        $addToSet: { following: { user: req.params.id } },
      }
    );
    await User.updateOne(
      {
        _id: req.params.id,
        'followers.user': { $ne: req.user._id },
      },
      {
        $addToSet: { followers: { user: req.user._id } },
      }
    );
    successHandler(res, 'become a fan successfully!');
  },
  async unFollow(req, res, next) {
    // 不能取消追蹤自己
    if (req.params.id === req.user._id) {
      return appError(
        401,
        'Bad Request Error - Failed to unfollow yourself.',
        next
      );
    }
    await User.updateOne(
      {
        _id: req.user._id,
      },
      {
        $pull: { following: { user: req.params.id } },
      }
    );
    await User.updateOne(
      {
        _id: req.params.id,
      },
      {
        $pull: { followers: { user: req.user._id } },
      }
    );
    successHandler(res, 'Unfollow successfully!');
  },
  async getUsers(req, res, next) {
    const { id } = req.params;
    if (id) {
      User.findById(id, (err, user) => {
        if (err) {
          return appError(400, 'Bad Request Error - ID not found', next);
        } else {
          successHandler(res, user);
        }
      });
    } else {
      const users = await User.find();
      successHandler(res, users);
    }
  },
  async deleteAllUsers(req, res, next) {
    const users = await User.deleteMany({});
    successHandler(res, users);
  },
  async deleteUsers(req, res, next) {
    const { id } = req.params;
    await User.findByIdAndDelete(id)
      .then((result) => {
        if (!result) {
          return appError(400, 'Bad Request Error - Failed to get data', next);
        }
        UserController.getUsers(req, res);
      })
      .catch(() => appError(400, 'Bad Request Error - ID not found', next));
  },
  async editUsers(req, res, next) {
    const { body } = req;
    const { id } = req.params;
    await User.findByIdAndUpdate(id, body)
      .then((result) => {
        if (!result) {
          return appError(400, 'Bad Request Error - Failed to get data', next);
        }
        UserController.getUsers(req, res);
      })
      .catch(() => appError(400, 'Bad Request Error - ID not found', next));
  },
};

module.exports = UserController;
