const mongoose = require("mongoose");

const AuthorSchema = new mongoose.Schema({
  details: {
    type: String,
    required: false,
  },
});

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  author: {
    type: AuthorSchema,
    required: false,
  },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
