const express = require("express");
const router = express.Router();
const Article = require("../models/Article");

router.get("/", async (req, res, next) => {
  try {
    const tags = await Article.distinct("tagList");
    res.json({ tags: tags });
  } catch (error) {
    res.status(400).json({ error: "something went wrong please try again" });
  }
});

module.exports = router;
