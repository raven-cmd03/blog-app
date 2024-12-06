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

app.post("/createuser", async (req, res) => {
  try {
    const { name, email } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const newUser = new User({ name, email });
    await newUser.save();

    res
      .status(201)
      .json({ message: "User created succesfully", user: newUser });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error Occured", error: error.message });
  }
});

app.post("/createblog", async (req, res) => {
  try {
    const { authorName, blogName, url } = req.body;

    const author = await User.findOne({ name: authorName.trim() });
    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }

    const newBlog = new Blog({ name: blogName, URL: url, author: author._id });
    await newBlog.save();

    res
      .status(201)
      .json({ message: "Blog created succesfully", blog: newBlog });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "error occured", error: error.message });
  }
});

app.post("/create_entry", async (req, res) => {
  try {
    const { name, article } = req.body;
    const author = await User.findOne({ name: name.trim() });
    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }

    const blog = await Blog.findOne({ author: author._id });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const newBlogEntry = {
      article,
      comment: [],
    };

    blog.blogEntry.push(newBlogEntry);

    await blog.save();

    res.status(201).json({ message: "entry created", entry: newBlogEntry });
  } catch (error) {
    res.status(500).json({ message: "Error Occured", error: error.message });
  }
});

app.post("/add_comment", async (req, res) => {
  try {
    const { blogId, blogEntryId, commentText, commentByUserId } = req.body;

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
      commentBy: commentByUserId,
    };

    blogEntry.comment.push(newComment);

    await blog.save();

    res
      .status(201)
      .json({ message: "Comment added successfully", comment: newComment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error occurred", error: error.message });
  }
});

app.post("/add_tag", async (req, res) => {
  try {
    const { blogId, blogEntryId, tagValue } = req.body;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const blogEntry = blog.blogEntry.id(blogEntryId);
    if (!blogEntry) {
      return res.status(404).json({ message: "Blog entry not found" });
    }

    const existingTag = blogEntry.tag.find((tag) => tag === tagValue);
    if (existingTag) {
      return res
        .status(400)
        .json({ message: "Tag already exists in the blog entry" });
    }

    blogEntry.tag.push(tagValue);

    await blog.save();

    res.status(201).json({ message: "Tag added successfully", tag: tagValue });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error occurred", error: error.message });
  }
});

app.listen(3000);
