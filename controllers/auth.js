import User from "../models/user";
import { hashPassword, comparePassword } from "../helpers/auth";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { compareSync } from "bcrypt";

export const register = async (req, res) => {
  //    console.log("register endpoint =>" ,req.body );
  const { name, email, password, secret } = req.body;

  if (!name) {
    return res.json({
      error: "Name is required",
    });
  }
  if (!password || password.length < 6)
    return res.json({
      error: "Password is required and should be 6 character long",
    });
  if (!secret) {
    return res.json({
      error: "Answer is required",
    });
  }
  const exist = await User.findOne({ email });
  if (exist) {
    return res.json({
      error: "Email is taken",
    });
  }
  const hashedPassword = await hashPassword(password);
  const user = new User({
    name,
    email,
    password: hashedPassword,
    secret,
    username: nanoid(6),
  });
  try {
    await user.save();
    console.log("REGISTRT USE=>", user);
    return res.json({
      ok: true,
    });
  } catch (err) {
    // console.log("REGISTER FAILED =>" ,err);
    return res.status(400).send("error. try again.");
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        error: "No user found",
      });
    }
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.json({
        error: "Wrong password",
      });
    }
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d", //20 * 60
    });
    user.password = undefined;
    user.secret = undefined;
    res.json({
      token,
      user,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send("error,try again");
  }
};
export const currentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    //  res.json(user);
    res.json({ ok: true });
  } catch (err) {
    console.log(err);
    res.sendStatus(400);
  }
};

export const forgotPassword = async (req, res) => {
  // console.log(req.body);
  const { email, newpassword, secret } = req.body;
  // console.log(email, newpassword, secret);
  if (!newpassword || newpassword < 6) {
    return res.json({
      error: "New password is required and should be min 6 character long",
    });
  }
  if (!secret) {
    return res.json({
      error: "Secret is required",
    });
  }
  const user = await User.findOne({ email, secret });
  if (!user) {
    return res.json({
      error: "We cant not verfiy  you with those details",
    });
  }
  try {
    const hashed = await hashPassword(newpassword);
    await User.findByIdAndUpdate(user._id, { password: hashed });
    return res.json({
      success: "congrats, Now you can login with your new password",
    });
  } catch (err) {
    console.log(err);
    return res.json({
      error: "Something went wrong. Try again.",
    });
  }
};
export const profileUpdate = async (req, res) => {
  try {
    // console.log("profile update req.body", req.body);
    const data = {};

    if (req.body.username) {
      data.username = req.body.username;
    }
    if (req.body.about) {
      data.about = req.body.about;
    }
    if (req.body.name) {
      data.name = req.body.name;
    }
    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.json({
          error: "password is required and should  be min 6 character long",
        });
      } else {
        data.password = await hashPassword(req.body.password);
      }
    }
    if (req.body.image) {
      data.image = req.body.image;
    }
    if (req.body.secret) {
      data.secret = req.body.secret;
    }
    let user = await User.findByIdAndUpdate(req.user._id, data, { new: true });
    user.password = undefined;
    user.secret = undefined;
    res.json(user);
  } catch (err) {
    if (err.code == 11000) {
      return res.json({ error: "Duplicated username" });
    }
    console.log(err);
  }
};

export const findPeople = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    //user.following
    let following = user.following;
    following.push(user._id);
    const people = await User.find({ _id: { $nin: following } })
      .select("-password -secret")
      .limit(10);

    res.json(people);
  } catch (err) {
    console.log(err);
  }
};
//middelware
export const addFollower = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.body._id, {
      $addToSet: { followers: req.user._id },
    });
    next();
  } catch (err) {
    console.log(err);
  }
};
export const userFollow = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $addToSet: { following: req.body._id },
      },
      { new: true }
    ).select("-password -secret");
    res.json(user);
  } catch (err) {
    console.log(err);
  }
};
export const userFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const following = await User.find({ _id: user.following }).limit(100);
    res.json(following);
  } catch (err) {
    console.log(err);
  }
};
export const removeFollower = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.body._id, {
      $pull: { followers: req.user._id },
    });
    next();
  } catch (err) {
    console.log(err);
  }
};
export const userUnfollow = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: { following: req.body._id },
      },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    console.log(err);
  }
};
export const searchUser = async (req, res) => {
  const { query } = req.params;

  if (!query) return;
  try {
    const user = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
      ],
    }).select("-password -secret");
    res.json(user);
  } catch (err) {
    console.log(err);
  }
};

export const getUser = async (req, res) => {
  try {
    const user= await User.findOne({username:req.params.username}).select("-password -secret");
    res.json(user)
  } catch (err) {
    console.log(err);
  }
};
