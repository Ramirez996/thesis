import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import './PeerSupport.css';
import { supabase } from '../supabaseClient'; 

// =========================================================================
// ✅ PostCard Component (Now with Comments, Delete, and Supabase Logic)
// =========================================================================
const PostCard = ({ post, space, posts, setPosts, isAdmin }) => {
    const [commentInput, setCommentInput] = useState('');
    const [showComments, setShowComments] = useState(false);

    // --- HELPER FUNCTIONS ---

    const getComments = () => post.comments || [];

    const addComment = async () => {
        if (!commentInput.trim()) return;
        
        const user = auth.currentUser;
        const userName = isAdmin && user ? user.email : 'Anonymous';
        
        // 1. Analyze comment text for emotion (Optional - can be skipped for simplicity)
        // You would uncomment and integrate your Flask /analyze endpoint here if needed.
        // const emotion = 'neutral'; 

        try {
            // 2. Insert comment into Supabase
            const { data: newComments, error } = await supabase
                .from('comments')
                .insert([
                    { 
                        post_id: post.id, 
                        user_name: userName, 
                        text: commentInput,
                        // emotion: emotion, 
                    },
                ])
                .select();

            if (error) throw error;
            
            const newComment = newComments[0];

            // 3. Update local state
            setPosts(prev => ({
                ...prev,
                [space]: prev[space].map(p =>
                    p.id === post.id 
                        ? { ...p, comments: [...getComments(), newComment] } 
                        : p
                ),
            }));

            setCommentInput('');
        } catch (error) {
            console.error("Failed to add comment:", error);
            alert('Failed to add comment.');
        }
    };

    const deletePost = async () => {
        if (!isAdmin) {
            alert("Only administrators can delete posts.");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this post and all its comments?")) return;

        try {
            await supabase.from('posts').delete().eq('id', post.id);

            // Update local state (Realtime subscription should also handle this)
            setPosts(prev => ({
                ...prev,
                [space]: prev[space].filter(p => p.id !== post.id),
            }));
        } catch (error) {
            console.error("Failed to delete post:", error);
            alert('Failed to delete post.');
        }
    };

    const deleteComment = async (commentId) => {
        if (!isAdmin) {
            alert("Only administrators can delete comments.");
            return;
        }
        try {
            await supabase.from('comments').delete().eq('id', commentId);

            // Update local state (Realtime subscription should also handle this)
            setPosts(prev => ({
                ...prev,
                [space]: prev[space].map(p =>
                    p.id === post.id 
                        ? { ...p, comments: p.comments.filter(c => c.id !== commentId) } 
                        : p
                ),
            }));
        } catch (error) {
            console.error("Failed to delete comment:", error);
            alert('Failed to delete comment.');
        }
    };

    // --- RENDER ---
    return (
        <div className={`post-card ${post.emotion}`}>
            <div className="post-header">
                <span className="post-user">
                    {isAdmin && post.user_name !== 'Anonymous' ? post.user_name : 'Anonymous'}
                </span>
                <span className="post-time">
                    {new Date(post.created_at).toLocaleString()}
                </span>
                {isAdmin && (
                    <button className='delete-post-btn' onClick={deletePost}>
                        🗑️ Delete Post
                    </button>
                )}
            </div>
            
            <p className="post-text">{post.text}</p>
            
            <div className="post-footer">
                <span className="post-emotion">Emotion: <strong>{post.emotion}</strong></span>
                <span className="comment-count-link" onClick={() => setShowComments(!showComments)}>
                    💬 {getComments().length} Comments 
                </span>
            </div>

            <div className="comment-box">
                <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                />
                <button onClick={addComment} disabled={!commentInput.trim()}>
                    Comment
                </button>
            </div>

            {showComments && (
                <div className="comments-section">
                    {getComments().map(comment => (
                        <div key={comment.id} className="comment">
                            <span className="comment-user">
                                {isAdmin && comment.user_name !== 'Anonymous' ? comment.user_name : 'Anonymous'}
                            </span>
                            <p className="comment-text">
                                {comment.text}
                                {comment.emotion && <span className="emotion-tag"> ({comment.emotion})</span>}
                            </p>
                            {isAdmin && (
                                <button
                                    className="delete-comment-btn"
                                    onClick={() => deleteComment(comment.id)}
                                >
                                    ❌
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
// =========================================================================

const userSpaces = [
  'Community Support',
  'Suggested Actions',
  'About Developers',
  'About System'
];

const adminSpaces = [
  'Admin Dashboard',
  'User Reports',
  'System Notifications',
  'Admin Actions',
];

// ✅ Categories 
const relatedCommunities = [
  'Depression',
  'Anxiety',
  'Personality',
  'Well-Being'
];

const PeerSupport = ({ initialSpace = 'Community Support' }) => {
  const [activeSpace, setActiveSpace] = useState(initialSpace);
  const [postInput, setPostInput] = useState('');
  const [posts, setPosts] = useState(() => {
    const initial = {};
    [...userSpaces, ...adminSpaces, ...relatedCommunities].forEach(space => {
      initial[space] = [];
    });
    return initial;
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [email, setEmail] = useState('');
  const [csvFile, setCsvFile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setIsAdmin(user.email === 'admin@gmail.com');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 1️⃣ Fetch posts AND their comments from Supabase on mount
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Fetch posts and join the comments table
        const { data, error } = await supabase
          .from('posts')
          .select('*, comments(*)') // Select all post fields AND all related comments
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Group posts by their space name
        const grouped = {};
        [...userSpaces, ...adminSpaces, ...relatedCommunities].forEach(space => {
          grouped[space] = [];
        });
        data.forEach(post => {
          if (grouped[post.space]) {
            // Sort comments by creation time
            if (post.comments) {
                post.comments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            }
            grouped[post.space].push(post);
          }
        });

        setPosts(grouped);
      } catch (error) {
        console.error('Error loading posts:', error);
      }
    };

    fetchPosts();
  }, []); 

  // 2️⃣ Realtime subscription for posts and comments
  useEffect(() => {
    // --- POSTS Channel ---
    const postsChannel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        payload => {
          // Add new post
          setPosts(prev => ({
            ...prev,
            [payload.new.space]: [{...payload.new, comments: []}, ...(prev[payload.new.space] || [])],
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        payload => {
            // Remove deleted post
            const spaceKey = payload.old.space; // Assumes 'space' field is available in payload.old
            setPosts(prev => ({
                ...prev,
                [spaceKey]: (prev[spaceKey] || []).filter(p => p.id !== payload.old.id),
            }));
        }
      )
      .subscribe();

    // --- COMMENTS Channel ---
    const commentsChannel = supabase
        .channel('comments-changes')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'comments' },
            payload => {
                // Find the post and add the new comment
                setPosts(prev => {
                    const nextState = {...prev};
                    for (const space in nextState) {
                        const postIndex = nextState[space].findIndex(p => p.id === payload.new.post_id);
                        if (postIndex !== -1) {
                            const post = nextState[space][postIndex];
                            post.comments = [...(post.comments || []), payload.new];
                            break; // Stop after finding the post
                        }
                    }
                    return nextState;
                });
            }
        )
        .on(
            'postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'comments' },
            payload => {
                // Find the post and remove the deleted comment
                setPosts(prev => {
                    const nextState = {...prev};
                    for (const space in nextState) {
                        const postIndex = nextState[space].findIndex(p => p.id === payload.old.post_id);
                        if (postIndex !== -1) {
                            const post = nextState[space][postIndex];
                            post.comments = (post.comments || []).filter(c => c.id !== payload.old.id);
                            break; // Stop after finding the post
                        }
                    }
                    return nextState;
                });
            }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, []);


  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // NOTE: Replace 'yourPassword' with the actual admin password from your Firebase setup
      await signInWithEmailAndPassword(auth, email, 'yourPassword'); 
    } catch (error) {
      console.error('Login failed:', error);
      alert('Failed to log in.');
    }
  };

  if (loading) return <div>Loading...</div>;

  // Determine which spaces to show in the left sidebar
  const spaces = isAdmin ? adminSpaces : userSpaces;
  const allSpaces = [...userSpaces, ...adminSpaces, ...relatedCommunities]; // Used for Post state initialization

  const handlePost = async () => {
    if (!postInput.trim()) return;
    const user = auth.currentUser;
    const userName = isAdmin && user ? user.email : 'Anonymous';

    setIsPosting(true);

    try {
      // Step 1️⃣ — Send text to Flask backend (Railway)
      // NOTE: Use the correct API URL for your Railway app
      const response = await fetch('https://thesis-mental-health-production.up.railway.app/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: postInput }),
      });

      const analysis = await response.json();
      const emotion = analysis.label || 'neutral';

      // Step 2️⃣ — Save the post in Supabase
      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            text: postInput,
            user_name: userName,
            emotion: emotion,
            space: activeSpace,
            created_at: new Date(),
          },
        ])
        .select();

      if (error) throw error;

      // Step 3️⃣ — The Realtime subscription should handle updating the local state, 
      // but for immediate display, you can still update it here.
      // However, relying on the subscription is cleaner. We'll skip manual state update 
      // here to avoid duplicates/race conditions with Realtime.

      setPostInput('');
    } catch (error) {
      console.error('Failed to post:', error);
      alert('Failed to post — please check console for details.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleCSVUpload = async () => {
    if (!csvFile) {
      alert('Please select a CSV file.');
      return;
    }
    // TODO: Implement actual CSV upload and training logic to your Flask backend here
    alert('CSV upload simulated — replace with backend endpoint call.');
  };

  if (isPosting) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <p>Posting your thoughts... 💭</p>
      </div>
    );
  }

  const renderCommunityPage = (community) => (
    <div className="community-page">
      <h3>{community} Discussion 💬</h3>
      <div className="posts-list">
        {posts[community]?.map(post => (
          <PostCard
            key={post.id}
            post={post}
            space={community}
            posts={posts}
            setPosts={setPosts}
            isAdmin={isAdmin}
          />
        ))}
      </div>
      <div className="post-box">
        <textarea
          rows="3"
          placeholder={`Share your thoughts about ${community}...`}
          value={postInput}
          onChange={(e) => setPostInput(e.target.value)}
        />
        <button onClick={handlePost}>Post</button>
      </div>
    </div>
  );

  const renderMainContent = () => {
    if (relatedCommunities.includes(activeSpace)) {
      return renderCommunityPage(activeSpace);
    }

    if (activeSpace === 'Suggested Actions') {
      return (
        <div className="resource-links">
          <h3>Suggested Actions</h3>
          <ul>
            <li>🏥 <a href="https://www.who.int/philippines/news/detail/12-10-2023-doh--who-launch-philippine-council-for-mental-health-strategic-framework-2024-2028" target="_blank" rel="noreferrer">DOH Mental Health Resources</a></li>
            <li>📍 <a href="https://www.ncmh.gov.ph/" target="_blank" rel="noreferrer">National Center for Mental Health</a> – Hotline: 1553</li>
            <li>📞 <a href="https://www.facebook.com/ncmhcrisishotline/" target="_blank" rel="noreferrer">NCMH Crisis Hotline (Facebook)</a></li>
            <li>🧠 <a href="https://mentalhealthph.org/" target="_blank" rel="noreferrer">MentalHealthPH.org</a></li>
            <li>🔍 <a href="https://nowserving.ph/psychology/" target="_blank" rel="noreferrer">Find a Psychologist</a></li>
          </ul>
          <p className="note">These resources are verified and can guide you to professional support. 💙</p>
        </div>
      );
    }

    if (activeSpace === 'About Developers') {
      return (
        <div className="about-developer">
          <h3>👨‍💻 About the Developers</h3>
          <p>
            This platform was developed as part of the thesis project: <br />
            <strong>"Mental Health Assessment Using Logistic Regression and BERT-based NLP for Early Detection of Psychological Distress"</strong>.
          </p>
        </div>
      );
    }
    
    // Default or Admin/User Spaces
    return (
      <>
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
          <button onClick={handlePost}>Post</button>
        </div>
      </>
    );
  };

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

        {renderMainContent()}

        {isAdmin && (
          <div className="csv-upload">
            <h4>📊 Train Emotion Classifier</h4>
            <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} />
            <button onClick={handleCSVUpload}>Upload & Train</button>
          </div>
        )}
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