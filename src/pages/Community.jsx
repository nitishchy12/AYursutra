import React, { useCallback, useEffect, useState } from 'react';
import { apiCreatePost, apiDeletePost, apiGetPosts, apiToggleLike } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Heart, Send, Trash2, User } from 'lucide-react';

export default function Community() {
  const { currentUser, userData } = useAuth();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const fetchPosts = useCallback(async () => {
    const data = await apiGetPosts();
    setPosts(data.data || data.posts || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  async function createPost(e) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || !currentUser || posting || trimmed.length > 500) return;
    setPosting(true);
    try {
      const data = await apiCreatePost(trimmed);
      setPosts((items) => [data.data || data.post, ...items]);
      setContent('');
    } finally {
      setPosting(false);
    }
  }

  async function likePost(postId) {
    if (!currentUser) return;
    const data = await apiToggleLike(postId);
    const updated = data.data || data.post;
    setPosts((items) => items.map((post) => String(post._id || post.id) === String(postId) ? updated : post));
  }

  async function deletePost(postId) {
    await apiDeletePost(postId);
    setPosts((items) => items.filter((post) => String(post._id || post.id) !== String(postId)));
  }

  return (
    <div className="container page" style={{ maxWidth: 820 }}>
      <header className="text-center" style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary-dark)' }}>Ayurveda Community</h1>
        <p className="muted">Ask questions and share your wellness journey.</p>
      </header>

      <section className="card" style={{ marginBottom: '1.5rem' }}>
        {currentUser ? (
          <form onSubmit={createPost}>
            <div className="community-compose">
              <Avatar name={userData?.name} />
              <div>
                <textarea className="input-field" maxLength={500} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Share your thoughts, ask a question..." />
                <div className="flex justify-between items-center">
                  <span className={content.length > 460 ? 'char-warning' : 'muted'}>{content.length}/500</span>
                  <button className="btn btn-primary" disabled={!content.trim() || posting || content.length > 500}><Send size={18} /> Post</button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="empty-state"><p>Please log in to join the discussion.</p><Link to="/login" className="btn btn-primary">Log In</Link></div>
        )}
      </section>

      {loading ? <div className="empty-state">Loading community posts...</div> : posts.length === 0 ? <div className="empty-state">No posts yet. Be the first to start a discussion!</div> : (
        <div className="post-list">
          {posts.map((post) => {
            const postId = post._id || post.id;
            const ownPost = String(post.author?._id || post.author) === String(currentUser?._id);
            return (
              <article key={postId} className="card">
                <div className="post-header">
                  <Avatar name={post.author?.name || post.authorName} />
                  <div>
                    <strong>{post.author?.name || post.authorName || 'AyurSutra Member'}</strong>
                    <p className="muted">{timeAgo(post.createdAt)}</p>
                  </div>
                  {(ownPost || currentUser?.role === 'admin') && <button className="text-button danger" onClick={() => deletePost(postId)}><Trash2 size={16} /> Delete</button>}
                </div>
                <p className="post-content">{post.content}</p>
                <button className={`like-button ${post.likedByMe ? 'liked' : ''}`} onClick={() => likePost(postId)} disabled={!currentUser}>
                  <Heart size={20} fill={post.likedByMe ? 'currentColor' : 'none'} /> {post.likesCount || 0}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Avatar({ name = 'A' }) {
  return <div className="author-avatar"><User size={16} />{String(name || 'A').charAt(0).toUpperCase()}</div>;
}

function timeAgo(value) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
