const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const comment = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: "User" },
    body: { type: String, required: true },
    articleId: { type: Schema.Types.ObjectId, ref: "Article" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Comment", comment);
