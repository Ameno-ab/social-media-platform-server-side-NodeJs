import express from "express";
import formidable from "express-formidable";

const router = express.Router();
import { requireSignin, canEditDeletePost} from "../middlewares";
import {
  createPost,
  uploadImage,
  postByUser,
  userPost,
  updatePost,
  deletePost,
  newsFeed,
  likePost,
  unlikePost,
  addComment,
  removeComment,
  totalPosts,
} from "../controllers/post";


router.post("/create-post", requireSignin, createPost);
router.post(
  "/upload-images",
  requireSignin,
  formidable({ maxFileSize: 5 * 1024 * 1024 }),
  uploadImage
);
router.get("/user-post", requireSignin, postByUser);
router.get("/user-post/:_id", requireSignin, userPost);
router.put("/update-post/:_id",requireSignin,canEditDeletePost, updatePost);
router.delete("/delete-post/:_id",requireSignin,canEditDeletePost,deletePost);
router.get('/news-feed/:page', requireSignin ,newsFeed);
router.put('/like-post' ,requireSignin,likePost);
router.put('/unlike-post' ,requireSignin,unlikePost);
router.put('/add-comment',requireSignin,addComment);
router.put('/remove-comment',requireSignin,removeComment);
router.get('/total-posts',totalPosts);
module.exports = router;
