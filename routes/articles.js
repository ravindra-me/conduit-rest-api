const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Article = require("../models/Article");
const auth = require("../middlewares/auth");
const Comment = require("../models/Comment");

router.use(auth.verifyToken);

// query based route
router.get("/", async (req, res) => {
  let query = {};
  let limit = 20;
  let offset = 0;
  try {
    if (req.query.limit) {
      limit = req.query.limit;
    }
    if (req.query.offset) {
      offset = req.query.offset;
    }
    if (req.query.author) {
      const user = await User.findOne({ username: req.query.author });
      query.author = user._id;
    }
    if (req.query.favorited) {
      const user = await User.findOne({ username: req.query.author });
      query._id = { $in: user.favorites };
    }
    if (req.query.tag) {
      query.tagList = { $in: [req.query.tag] };
    }
    const articles = await Article.find(query)
      .limit(Number(limit))
      .skip(Number(offset))
      .sort({ createAt: "desc" });
    const currentUser = await User.findById(req.user.userId);
    let articleArray = articles.map((article) =>
      articleGenerator(article, currentUser, req.user.userId)
    );
    res.json({ articles: articleArray });
  } catch (e) {
    res.status(400).json({ error: "please search right article" });
  }
});

router.get("/feed", async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    console.log(user);
    if (user) {
      let limit = 20;
      let offset = 0;
      if (req.query.limit) {
        limit = req.query.limit;
      }
      if (req.query.offset) {
        offset = req.query.offset;
      }
      const articles = await Article.find({ author: { $in: user.following } })
        .limit(Number(limit))
        .skip(Number(offset))
        .sort({ createAt: "desc" });
      res.json({
        articles: articles.map((article) =>
          articleGenerator(article, user, req.user.userId)
        ),
      });
    } else {
      res.status(400).json({ error: "first you login" });
    }
  } catch (error) {
    res.status(400).json({
      error: "not found please try again and enter vaild input",
    });
  }
});

// ----------------------create new article -----------------
router.post("/", async (req, res) => {
  console.log("hello");
  try {
    req.body.article.author = req.user.userId;
    console.log("hello");
    const article = await Article.create(req.body.article);
    console.log({ article });
    res.json({ article });
  } catch (error) {
    res.send(error);
  }
});

//----------update article data-------------

router.put("/:slug", async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug });
    if (article.author.toString() === req.user.userId.toString()) {
      //   console.log(req.body.article);
      if (req.body.article.title) {
        req.body.article.slug = auth.slug(req.body.article.title);
      }
      const updateArticle = await Article.findOneAndUpdate(
        { slug: req.params.slug },
        req.body.article,
        { new: true }
      );
      console.log({ updateArticle });
      res.json({ updateArticle });
    } else {
      res.status(400).json({ error: "you are not the author of this article" });
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

//----------- delete article------

router.delete("/:slug", async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug });
    if (article.author.toString() === req.user.userId.toString()) {
      const deleteArticle = await Article.findOneAndDelete({
        slug: req.params.slug,
      });
      const comments = await Comment.deleteMany({ articleId: article._id });
      res.json({ deleteArticle });
    } else {
      res.status(400).json({ error: "Invaild condidate" });
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

// -------------comments----------------

router.get("/:slug/comments", async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug }).populate(
      "commentId"
    );
    res.json({ comments: article.commentId });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.post("/:slug/comments", async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug });
    req.body.comment.author = req.user.userId;
    req.body.comment.articleId = article._id;
    const comment = await Comment.create(req.body.comment);
    const populateComment = await comment.populate("author").execPopulate();
    article.commentId.push(comment._id);
    const updateArticle = await article.save();
    console.log({ populateComment });
    res.json({
      comment: commentGenerator(comment, populateComment.author, article),
    });
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete("/:slug/comments/:id", async (req, res) => {
  try {
    const deleteComment = await Comment.findByIdAndDelete(req.params.id);
    if (deleteComment) {
      const article = await Article.findOneAndUpdate(
        { slug: req.params.slug },
        { $pull: { commentId: deleteComment._id } },
        { new: true }
      );
      console.log(article);
      res.json({ article, deleteComment });
    } else {
      res.status(400).json({ error: "comment id not define" });
    }
  } catch (e) {
    res.status(400).json({ error: e });
  }
});

//---------------------- favorite and unfavorite article---------------------------

router.post("/:slug/favorite", async (req, res) => {
  console.log(req.params.slug);
  try {
    const article = await Article.findOne({ slug: req.params.slug });
    console.log(article, "hi");
    if (article) {
      const user = await User.findById(req.user.userId);
      console.log(user);
      if (user.favorites.includes(article._id)) {
        res.json({ article: articleGenerator(article, user, req.user.userId) });
      } else {
        article.favorited.push(user._id);
        article.favoritesCount += 1;
        user.favorites.push(article._id);
        const updateArticle = await article.save();
        const updateUser = await user.save();
        console.log({ updateArticle });
        res.json({
          article: articleGenerator(updateArticle, updateUser, req.user.userId),
        });
      }
    } else {
      res.status(400).json({ error: "it is not find" });
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete("/:slug/favorite", async (req, res) => {
  console.log(req.params.slug);
  try {
    const article = await Article.findOne({ slug: req.params.slug });
    console.log(article, "hi");
    if (article) {
      const user = await User.findById(req.user.userId);
      console.log(user);
      if (!user.favorites.includes(article._id)) {
        res.json({ article: articleGenerator(article, user, req.user.userId) });
      } else {
        article.favorited.pull(user._id);
        article.favoritesCount -= 1;
        user.favorites.pull(article._id);
        const updateArticle = await article.save();
        const updateUser = await user.save();
        console.log({ updateArticle });
        res.json({
          article: articleGenerator(updateArticle, updateUser, req.user.userId),
        });
      }
    } else {
      res.status(400).json({ error: "it is not find" });
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

//-----------------------------general function ------------------
function articleGenerator(article, user, userId) {
  const isFavoritesByUser = user.favorites.includes(article._id);
  const isFollowing = user.following.includes(article.author);
  console.log(isFollowing);
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList: article.tagList,
    favoritesCount: article.favoritesCount,
    favorited: isFavoritesByUser,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    author: {
      username: user.username,
      bio: user.bio,
      image: user.image,
      following: isFollowing,
    },
  };
}

function commentGenerator(comment, author, article) {
  let isFollowing = author.following.includes(article.author);
  console.log(isFollowing);
  return {
    id: comment._id,
    createdAt: comment.createAt,
    updatedAt: comment.updatedAt,
    author: {
      username: author.username,
      bio: author.bio,
      image: author.image,
      following: isFollowing,
    },
  };
}

module.exports = router;
