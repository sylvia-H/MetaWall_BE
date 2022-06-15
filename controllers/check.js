const successHandler = require('../helper/successHandlers');

const CheckController = {
  async checkToken(req, res, next) {
    successHandler(res, req.user);
  },
};

module.exports = CheckController;
