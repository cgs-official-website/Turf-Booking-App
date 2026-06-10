const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [3, "Name must be at least 3 characters long"],
    maxlength: [20, "Name must be less than 20 characters long"],
  },

  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
  },

  password: {
    type: String,
    required: [true, "Password is required"],
  },

  phone: {
    type: String,
    required: [true, "Phone number is required"],
  },

  role: {
    type: String,
    enum: ['user', 'vendor'],
    default: 'user', //enum stands for enumeration(restrict a field to a fixed set of allowed values.)
  },
},

  {timestamps: true}
);

module.exports = mongoose.model("User",userSchema);
