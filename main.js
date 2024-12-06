const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/User.js");
const Blog = require("./models/Blog.js");
const Tag = require("./models/Tag.js");

const app = express();

app.use(express.json());

mongoose
  .connect("mongodb://127.0.0.1:27017/BlogApp")
  .then(() => console.log("connected to db"))
  .catch((err) => console.error("failed to connect to db", err));

app.post("/users", async (req, res) => {
  try {
    const { name, email } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new User({ name, email });
    await newUser.save();

    res.status(201).json({ message: "new user created", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Error occured", error: error });
  }
});

app.post("/blog", async (req, res) => {
  try {
    const { name, URL, author } = req.body;

    if (await Blog.findOne({ URL })) {
      return res.status(400).json({ message: "Blog already exists" });
    }

    const newBlog = new Blog(req.body);
    await newBlog.save();

    res.status(201).json({ message: "blog created", blog: newBlog });
  } catch (error) {
    res.status(500).json({ message: "error occured", error: error });
  }
});

app.post("/entry", async (req, res) => {
  try {
    const { blogId, article, tags } = req.body;

    const existingBlog = await Blog.findById(blogId);
    if (!existingBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const tagIds = [];
    for (const tagValue of tags) {
      let tag = await Tag.findOne({ value: tagValue });
      if (!tag) {
        tag = await Tag.create({ value: tagValue });
      }
      tagIds.push(tag._id);
    }

    const newBlogEntry = {
      article,
      tag: tagIds,
    };
    existingBlog.blogEntry.push(newBlogEntry);

    await existingBlog.save();

    res.status(201).json({
      message: "Blog entry added successfully",
      entry: newBlogEntry,
    });
  } catch (error) {
    res.status(500).json({ message: "Error occurred", error: error.message });
  }
});

app.post("/comment", async (req, res) => {
  try {
    const { blogId, blogEntryId, commentText, userId } = req.body;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const blogEntry = blog.blogEntry.id(blogEntryId);
    if (!blogEntry) {
      return res.status(404).json({ message: "Blog entry not found" });
    }

    const newComment = {
      comment: commentText,
      commentBy: userId,
    };

    blogEntry.comment.push(newComment);

    await blog.save();

    res.status(201).json({ message: "Comment added successfully", blogEntry });
  } catch (error) {
    res.status(500).json({ message: "Error occurred", error: error.message });
  }
});

app.listen(3000);
