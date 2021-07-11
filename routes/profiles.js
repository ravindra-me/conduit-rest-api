const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middlewares/auth");

router.use(auth.verifyToken);

router.get("/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    res.json({
      user: {
        username: user.username,
        bio: user.bio,
        image: user.image,
        following:
          user.follower.includes(req.user.userId) && req.user.userId
            ? true
            : false,
      },
    });
  } catch (e) {
    res
      .status(400)
      .json({ error: "invaild username please enter write username" });
  }
});

router.post("/:username/follow", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (user) {
      const currentUser = await User.findById(req.user.userId);
      if (!currentUser.following.includes(user._id)) {
        currentUser.following.push(user._id);
        user.follower.push(currentUser._id);
        var update = await currentUser.save();
        var updateUser = await user.save();
        res.json({
          user: createProfile(updateUser, update),
        });
      } else {
        res.json({
          user: createProfile(updateUser, update),
        });
      }
    } else {
      res.status(400).json({ error: "invalid-02" });
    }
  } catch (error) {
    res.status(200).send(error);
  }
});

router.delete("/:username/follow", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (user) {
      const currentUser = await User.findById(req.user.userId);
      if (currentUser.following.includes(user._id)) {
        currentUser.following.pull(user._id);
        user.follower.pull(currentUser._id);
        var update = await currentUser.save();
        var updateUser = await user.save();
        res.json({
          user: createProfile(updateUser, update),
        });
      } else {
        res.json({
          user: createProfile(updateUser, update),
        });
      }
    } else {
      throw new Error("invalid-02");
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

function createProfile(user, currentUser) {
  const isFollowing = currentUser.following.includes(user._id);
  return {
    username: currentUser.username,
    bio: currentUser.bio,
    image: currentUser.image,
    following: isFollowing,
  };
}

module.exports = router;
