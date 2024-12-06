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

app.listen(3000);
