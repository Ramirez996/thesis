import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import './PeerSupport.css';
import { supabase } from '../supabaseClient';

// =========================================================================
// PostCard Component
// =========================================================================
const PostCard = ({ post, space, posts, setPosts, isAdmin }) => {
  const [comment, setComment] = useState('');

  // Add comment
  const addComment = async () => {
    if (!comment.trim()) return;

    try {
      // Analyze emotion before saving
      const response = await fetch('https://thesis-mental-health-production.up.railway.app/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: comment }),
      });
      const analysis = await response.json();
      const emotion = analysis.label || 'neutral';

      const { data, error } = await supabase
        .from('comments')
        .insert([{ post_id: post.id, text: comment, emotion }])
        .select();

      if (error) throw error;

      const newComment = data[0];
      const updatedPosts = posts[space].map(p =>
        p.id === post.id ? { ...p, comments: [...(p.comments || []), newComment] } : p
      );
      setPosts({ ...posts, [space]: updatedPosts });
      setComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  // Delete post
  const deletePost = async () => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', post.id);
      if (error) throw error;

      setPosts(prev => ({
        ...prev,
        [space]: prev[space].filter(p => p.id !== post.id),
      }));
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  // Delete comment
  const deleteComment = async (commentId) => {
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;

      const updatedPosts = posts[space].map(p =>
        p.id === post.id ? { ...p, comments: p.comments.filter(c => c.id !== commentId) } : p
      );
      setPosts({ ...posts, [space]: updatedPosts });
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  return (
    <div className={`post-card ${post.emotion}`}>
      <div className="post-header">
        <span className="post-user">{post.user_name || 'Anonymous'}</span>
        <span className="post-time">{new Date(post.created_at).toLocaleString()}</span>
      </div>

      <p className="post-text">{post.text}</p>

      <div className="post-footer">
        <span className="post-emotion">🧠 Emotion: {post.emotion}</span>
        {isAdmin && (
          <button className="delete-button" onClick={deletePost}>🗑 Delete</button>
        )}
      </div>

      {/* Comments section */}
      <div className="comments">
        {post.comments?.map(c => (
          <div key={c.id} className="comment">
            <p>
              💬 {c.text}
              {c.emotion && <span className="emotion-tag"> ({c.emotion})</span>}
            </p>
            {isAdmin && (
              <button className="delete-comment" onClick={() => deleteComment(c.id)}>
                Delete
              </button>
            )}
          </div>
        ))}

        <div className="comment-area">
          <input
            type="text"
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button onClick={addComment}>Comment</button>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// Main PeerSupport Component
// =========================================================================
const userSpaces = [
  'Community Support',
  'Suggested Actions',
  'About Developers',
  'About System',
];

const adminSpaces = [
  'Admin Dashboard',
  'User Reports',
  'System Notifications',
  'Admin Actions',
];

const relatedCommunities = [
  'Depression',
  'Anxiety',
  'Personality',
  'Well-Being',
];

const PeerSupport = ({ initialSpace = 'Community Support' }) => {
  const [activeSpace, setActiveSpace] = useState(initialSpace);
  const [postInput, setPostInput] = useState('');
  const [posts, setPosts] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setIsAdmin(user.email === 'admin@gmail.com');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch posts with comments
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*, comments(*)')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const grouped = {};
        [...userSpaces, ...adminSpaces, ...relatedCommunities].forEach(space => {
          grouped[space] = [];
        });

        data.forEach(post => {
          if (grouped[post.space]) grouped[post.space].push(post);
        });

        setPosts(grouped);
      } catch (error) {
        console.error('Error loading posts:', error);
      }
    };

    fetchPosts();
  }, []);

  // Handle posting
  const handlePost = async () => {
    if (!postInput.trim()) return;
    const user = auth.currentUser;
    const userName = isAdmin && user ? user.email : 'Anonymous';

    setIsPosting(true);
    try {
      const response = await fetch('https://thesis-mental-health-production.up.railway.app/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: postInput }),
      });

      const analysis = await response.json();
      const emotion = analysis.label || 'neutral';

      const { data, error } = await supabase
        .from('posts')
        .insert([{ text: postInput, user_name: userName, emotion, space: activeSpace }])
        .select();

      if (error) throw error;

      setPosts(prev => ({
        ...prev,
        [activeSpace]: [data[0], ...(prev[activeSpace] || [])],
      }));

      setPostInput('');
    } catch (error) {
      console.error('Failed to post:', error);
      alert('Failed to post — please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  const spaces = isAdmin ? adminSpaces : userSpaces;

  return (
    <div className="peer-layout">
      <aside className="left-sidebar">
        <h3>Spaces</h3>
        <ul>
          {spaces.map(space => (
            <li
              key={space}
              className={space === activeSpace ? 'active' : ''}
              onClick={() => setActiveSpace(space)}
            >
              {space}
            </li>
          ))}
        </ul>
      </aside>

      <main className="main-content">
        <div className="space-header">
          <h2>{activeSpace}</h2>
          <p className="anonymous-note">All posts are anonymous 💬</p>
        </div>

        <div className="posts-list">
          {posts[activeSpace]?.map(post => (
            <PostCard
              key={post.id}
              post={post}
              space={activeSpace}
              posts={posts}
              setPosts={setPosts}
              isAdmin={isAdmin}
            />
          ))}
        </div>

        <div className="post-box">
          <textarea
            rows="3"
            placeholder="Share your thoughts anonymously..."
            value={postInput}
            onChange={(e) => setPostInput(e.target.value)}
          />
          <button onClick={handlePost} disabled={isPosting}>
            {isPosting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </main>

      <aside className="right-sidebar">
        <h4>Categories</h4>
        <ul>
          {relatedCommunities.map(category => (
            <li
              key={category}
              className={category === activeSpace ? 'active' : ''}
              onClick={() => setActiveSpace(category)}
            >
              {category}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
};

export default PeerSupport;
