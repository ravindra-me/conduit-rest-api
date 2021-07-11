var express = require("express");
var router = express.Router();
const User = require("../models/User");
const auth = require("../middlewares/auth");

/* GET users listing. */

router.post("/", async (req, res) => {
  try {
    console.log(req.body.user);
    const user = await User.create(req.body.user);
    var token = await user.signToken();
    console.log(token);
    res.json({ user: user.userJson(token) });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body.user;
  if (!email || !password) {
    res.status(400).json({ error: "Email/password required" });
  }
  try {
    const user = await User.findOne({ email: req.body.user.email });
    if (!user) {
      res.status(400).json({ error: "Email is not ragistered" });
    }
    const result = user.verifyPassword(req.body.user.password);
    if (!result) {
      res.status(400).json({ error: "Invailid password" });
    }
    var token = await user.signToken();
    res.json({ user: user.userJson(token) });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.use(auth.verifyToken);

// current user

router.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.json({
      user: {
        username: user.username,
        bio: user.bio,
        image: user.image ? user.image : null,
      },
    });
  } catch (error) {
    res.status(400).send(error);
  }
});

// update details of current user
router.put("/", async (req, res) => {
  try {
    if (req.body.user.password) {
      req.body.user.password = auth.hash(req.body.user.password);
    }
    const update = await User.findByIdAndUpdate(
      req.user.userId,
      req.body.user,
      { new: true }
    );
    res.json({ user: update });
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;
