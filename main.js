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

app.post("/entry", async (req, res) => {
  try {
    const { blogId, article, tags, comments } = req.body;

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

    const newBlogEntry = { article, tag: tagIds };

    // Add comments to the blog entry if provided
    if (comments && comments.length > 0) {
      newBlogEntry.comment = comments.map((commentText) => ({
        comment: commentText,
        commentBy: req.body.userId, // Assuming `userId` is passed with the request
      }));
    }

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

app.get("/blogs/author/:authorId", async (req, res) => {
  try {
    const authorId = req.params.authorId;
    const blogs = await Blog.find({ author: authorId }).populate(
      "author",
      "name email"
    );

    if (!blogs.length) {
      return res
        .status(404)
        .json({ message: "No blogs found for this author" });
    }

    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Error occurred", error: error.message });
  }
});

app.get("/comments/:blogId/:blogEntryId", async (req, res) => {
  try {
    const { blogId, blogEntryId } = req.params;

    const blog = await Blog.findById(blogId).populate({
      path: "blogEntry",
      match: { _id: blogEntryId },
      populate: { path: "comment.commentBy", select: "name" },
    });

    const blogEntry = blog.blogEntry.id(blogEntryId);
    if (!blogEntry) {
      return res.status(404).json({ message: "Blog entry not found" });
    }

    res.status(200).json(blogEntry.comment);
  } catch (error) {
    res.status(500).json({ message: "Error occurred", error: error.message });
  }
});

app.get("/blogs/tag/:tagValue", async (req, res) => {
  try {
    const { tagValue } = req.params;
    const tag = await Tag.findOne({ value: tagValue });

    if (!tag) {
      return res.status(404).json({ message: "Tag not found" });
    }

    const blogs = await Blog.find({ tag: tag._id }).populate("tag", "value");
    if (!blogs.length) {
      return res.status(404).json({ message: "No blogs found for this tag" });
    }

    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Error occurred", error: error.message });
  }
});

app.put("/comment/:blogId/:blogEntryId/:commentId", async (req, res) => {
  try {
    const { blogId, blogEntryId, commentId } = req.params;
    const { newCommentText } = req.body;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const blogEntry = blog.blogEntry.id(blogEntryId);
    if (!blogEntry) {
      return res.status(404).json({ message: "Blog entry not found" });
    }

    const comment = blogEntry.comment.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    comment.comment = newCommentText;
    await blog.save();

    res.status(200).json({
      message: "Comment updated successfully",
      updatedComment: comment,
    });
  } catch (error) {
    res.status(500).json({ message: "Error occurred", error: error.message });
  }
});

app.put("/blog/author/:blogId", async (req, res) => {
  try {
    const { blogId } = req.params;
    const { newAuthorId } = req.body;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    blog.author = newAuthorId;
    await blog.save();

    res.status(200).json({ message: "Author updated successfully", blog });
  } catch (error) {
    res.status(500).json({ message: "Error occurred", error: error.message });
  }
});

app.delete("/entry/:blogId/:blogEntryId", async (req, res) => {
  try {
    const { blogId, blogEntryId } = req.params;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const blogEntry = blog.blogEntry.id(blogEntryId);
    if (!blogEntry) {
      return res.status(404).json({ message: "Blog entry not found" });
    }

    blog.blogEntry.pull(blogEntryId);
    await blog.save();

    res
      .status(200)
      .json({ message: "Blog entry and comments deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error occurred", error: error.message });
  }
});

app.delete("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Remove user's comments from blogs
    await Blog.updateMany(
      { "blogEntry.comment.commentBy": userId },
      { $pull: { "blogEntry.$[].comment": { commentBy: userId } } }
    );

    // Remove all blogs created by the user
    await Blog.deleteMany({ author: userId });

    // Remove the user
    await User.findByIdAndDelete(userId);

    res
      .status(200)
      .json({ message: "User and associated data deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error occurred", error: error.message });
  }
});

app.get("/blogs/countByAuthor", async (req, res) => {
  try {
    const authorsCount = await Blog.aggregate([
      { $group: { _id: "$author", count: { $sum: { $size: "$blogEntry" } } } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "authorDetails",
        },
      },
      { $unwind: "$authorDetails" },
      { $project: { author: "$authorDetails.name", count: 1 } },
    ]);

    res.status(200).json(authorsCount);
  } catch (error) {
    res.status(500).json({ message: "Error occurred", error: error.message });
  }
});

app.get("/author/:authorId/tags", async (req, res) => {
  try {
    const { authorId } = req.params;

    const blogs = await Blog.find({ author: authorId }).populate(
      "blogEntry.tag"
    );

    const tags = new Set();
    blogs.forEach((blog) => {
      blog.blogEntry.forEach((entry) => {
        entry.tag.forEach((tag) => {
          tags.add(tag.value);
        });
      });
    });

    res.status(200).json({ tags: Array.from(tags) });
  } catch (error) {
    res.status(500).json({ message: "Error occurred", error: error.message });
  }
});

app.listen(3000);
