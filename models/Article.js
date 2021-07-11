const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const article = new Schema(
  {
    title: { type: String, trim: true, required: true },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    body: { type: String, required: true },
    tagList: [{ type: String }],
    author: { type: Schema.Types.ObjectId, ref: "User" },
    favoritesCount: { type: Number, default: 0 },
    favorited: [{ type: Schema.Types.ObjectId, ref: "User" }],
    commentId: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  },
  {
    timestamps: true,
  }
);

function convertToSlug(str) {
  return str
    .trim()
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "")
    .concat(Math.floor(Math.random() * 1000));
}

article.pre("save", function (next) {
  if (this.title && this.isModified("title")) {
    this.slug = convertToSlug(this.title);
  }
  next();
});

module.exports = mongoose.model("Article", article);
