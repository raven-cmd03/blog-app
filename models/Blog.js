const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  comment: {
    type: String,
    required: true,
  },
  commentDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  commentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const BlogEntrySchema = new mongoose.Schema({
  article: {
    type: String,
    required: true,
  },
  publishDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  comment: [CommentSchema],
  tag: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
    },
  ],
});

const BlogSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  URL: {
    type: String,
    require: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  blogEntry: [BlogEntrySchema],
});

const Blog = mongoose.model("Blog", BlogSchema);

module.exports = Blog;
