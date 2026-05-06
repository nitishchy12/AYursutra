const express = require('express');
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

function formatPost(post, userId) {
  const raw = post.toObject ? post.toObject() : post;
  const likedByMe = userId ? raw.likes.some((id) => String(id) === String(userId)) : false;
  return {
    _id: raw._id,
    id: String(raw._id),
    content: raw.content,
    author: raw.author,
    authorName: raw.author?.name || 'AyurSutra Member',
    likesCount: raw.likesCount || raw.likes.length,
    likes: raw.likes.map(String),
    likedByMe,
    createdAt: raw.createdAt,
  };
}

router.get('/', protect, asyncHandler(async (req, res) => {
  const posts = await Post.find().populate('author', 'name').sort({ createdAt: -1 });
  res.json({ success: true, data: posts.map((post) => formatPost(post, req.user._id)), posts: posts.map((post) => formatPost(post, req.user._id)) });
}));

router.post('/', protect, asyncHandler(async (req, res) => {
  const content = String(req.body.content || '').trim();
  if (!content) return res.status(400).json({ success: false, message: 'Post content is required' });
  if (content.length > 500) return res.status(400).json({ success: false, message: 'Post cannot exceed 500 characters' });
  const post = await Post.create({ content, author: req.user._id, likes: [], likesCount: 0 });
  await post.populate('author', 'name');
  res.status(201).json({ success: true, data: formatPost(post, req.user._id), post: formatPost(post, req.user._id) });
}));

router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
  if (String(post.author) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only the author or admin can delete this post' });
  }
  await post.deleteOne();
  res.json({ success: true, data: null });
}));

router.put('/:id/like', protect, asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate('author', 'name');
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
  const liked = post.likes.some((id) => String(id) === String(req.user._id));
  post.likes = liked ? post.likes.filter((id) => String(id) !== String(req.user._id)) : [...post.likes, req.user._id];
  post.likesCount = post.likes.length;
  await post.save();
  await post.populate('author', 'name');
  res.json({ success: true, data: formatPost(post, req.user._id), post: formatPost(post, req.user._id) });
}));

module.exports = router;
