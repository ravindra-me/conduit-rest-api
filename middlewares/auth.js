const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
module.exports = {
  verifyToken: async (req, res, next) => {
    var token = req.headers.authorization;
    console.log(token);
    try {
      if (token) {
        const payload = await jwt.verify(token, process.env.SECRET);
        console.log({ payload });
        req.user = payload;
        next();
      } else {
        res.status(400).json({ error: "You are not login, please login " });
      }
    } catch (error) {
      next(error);
    }
  },
  slug: function (str) {
    return str
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "")
      .concat(Math.floor(Math.random() * 1000));
  },
  hash: async function (password) {
    try {
      const hashed = await bcrypt.hash(password, 10);
      return hashed;
    } catch (error) {
      res.status(400).send(error);
    }
  },
};
