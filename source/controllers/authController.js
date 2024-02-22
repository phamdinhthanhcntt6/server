const UserModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const asyncHandle = require("express-async-handler");
const jwt = require("jsonwebtoken");
const getJsonWebToken = async (email, id) => {
  const payload = {
    email,
    id
  };

  const token = jwt.sign(payload, process.env.SECRET_KEY, {
    expiresIn: "7d" //token hết hạn sau 7 ngày
  });

  return token;
};

const register = asyncHandle(async (req, res) => {
  const { email, fullname, password } = req.body;
  //check if user already exists
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    res.status(401);
    throw new Error(`User has already exists`);
  }
  //hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  //console.log(hashedPassword);
  //create new user
  const newUser = new UserModel({
    fullname: fullname ?? "",
    email,
    password: hashedPassword
  });
  await newUser.save();
  res.status(200).json({
    message: "Register new user successfully",
    data: {
      ...newUser,
      accesstoken: await getJsonWebToken(email, newUser.id)
    }
  });
  return;
  //res.send("register");
});

module.exports = {
  register
};