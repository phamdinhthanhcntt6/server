const UserModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const asyncHandle = require("express-async-handler");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: process.env.USERNAME_EMAIL,
    pass: process.env.PASSWORD_EMAIL,
  },
});

const getJsonWebToken = async (email, id) => {
  const payload = {
    email,
    id,
  };

  const token = jwt.sign(payload, process.env.SECRET_KEY, {
    expiresIn: "7d", //token hết hạn sau 7 ngày
  });

  return token;
};

const handleSendEmail = async (val) => {
  try {
    await transporter.sendMail(val);
    //console.log(result);
    return "OK";
  } catch (err) {
    return err;
  }
};

const verification = asyncHandle(async (req, res) => {
  const { email } = req.body;
  const verificationCode = Math.round(Math.random() * 9000 + 1000);
  try {
    const data = {
      from: `Verify <${process.env.USERNAME_EMAIL}>`,
      to: email,
      subject: "Verify your email",
      text: `Verification email`,
      html: `<h1>${verificationCode}</h1>`,
    };
    await handleSendEmail(data);
    res.status(200).json({
      message: "Send verification code successfully",
      data: {
        code: verificationCode,
      },
    });
  } catch (error) {
    res.status(401);
    throw new Error(`Verification`);
  }
  return;
});

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
    password: hashedPassword,
  });
  await newUser.save();
  res.status(200).json({
    message: "Register new user successfully",
    data: {
      email: newUser.email,
      id: newUser.id,
      accesstoken: await getJsonWebToken(email, newUser.id),
    },
  });
  return;
  //res.send("register");
});

const login = asyncHandle(async (req, res) => {
  const { email, password } = req.body;
  const existingUser = await UserModel.findOne({ email });
  if (!existingUser) {
    res.status(403).json({
      message: "User not found",
    });
    throw new Error(`User not found`);
  }
  const isMatchPassword = await bcrypt.compare(password, existingUser.password);
  if (!isMatchPassword) {
    res.status(401);
    throw new Error(`Invalid email or password`);
  }
  res.status(200).json({
    message: "Login successfully",
    data: {
      email: existingUser.email,
      id: existingUser.id,
      accesstoken: await getJsonWebToken(email, existingUser.id),
    },
  });
});

const forgotPassword = asyncHandle(async (req, res) => {
  const { email } = req.body;

  const randomPassword = Math.round(100000 + Math.random() * 99000);

  const data = {
    from: `"New Password" <${process.env.USERNAME_EMAIL}>`,
    to: email,
    subject: "Verification email code",
    text: "Your code to verification email",
    html: `<h1>${randomPassword}</h1>`,
  };

  const user = await UserModel.findOne({ email });
  if (user) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(`${randomPassword}`, salt);

    await UserModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      isChangePassword: true,
    })
      .then(() => {
        console.log("Done");
      })
      .catch((error) => console.log(error));

    await handleSendEmail(data)
      .then(() => {
        res.status(200).json({
          message: "Send email new password successfully!!!",
          data: [],
        });
      })
      .catch((error) => {
        res.status(401);
        throw new Error("Can not send email");
      });
  } else {
    res.status(401);
    throw new Error("User not found!!!");
  }
  return;
});
const handleLoginWithGoogle = asyncHandle(async (req, res) => {
  const userInfo = req.body;

  const existingUser = await UserModel.findOne({ email: userInfo.email });

  let user = { ...userInfo };

  if (existingUser) {
    await UserModel.findByIdAndUpdate(existingUser.id, {
      ...userInfo,
      updateAt: Date.now(),
    }),
      (user.accesstoken = await getJsonWebToken(userInfo.email, userInfo.id));
  } else {
    const newUser = new UserModel({
      email: userInfo.email,
      fullname: userInfo.name,
      ...userInfo,
    });
    await newUser.save();

    user.accesstoken = await getJsonWebToken(userInfo.email, newUser.id);
  }

  res.status(200).json({
    message: "Login with google successfully",
    data: user,
  });
});

module.exports = {
  register,
  login,
  verification,
  forgotPassword,
  handleLoginWithGoogle,
};
