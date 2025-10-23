import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import './PeerSupport.css';
import { supabase } from '../supabaseClient';

// -------------------- Spaces --------------------
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

const relatedCommunities = [
  'Anxiety',
  'Depression',
  'Well-Being',
  'Personality'
];

// -------------------- Main Component --------------------
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
  const [commentsByPost, setCommentsByPost] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [email, setEmail] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [username, setUsername] = useState('');
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  const ANALYZE_URL = 'https://thesis-mental-health-production.up.railway.app/analyze';
  const CSV_UPLOAD_URL = 'https://thesis-mental-health-production.up.railway.app/upload_csv';

  // -------------------- Auth + Username --------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setCurrentUser(user);
        setIsAdmin(user.email === 'admin@gmail.com');
        const storedUsernames = JSON.parse(localStorage.getItem('peer_usernames') || '{}');
        const userSpecificName = storedUsernames[user.uid];
        if (userSpecificName) setUsername(userSpecificName);
        else setShowUsernamePrompt(true);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSetUsername = () => {
    if (!tempUsername.trim()) {
      alert('Please enter a valid username.');
      return;
    }
    if (!currentUser) {
      alert('You must be signed in to save a username.');
      return;
    }
    const storedUsernames = JSON.parse(localStorage.getItem('peer_usernames') || '{}');
    storedUsernames[currentUser.uid] = tempUsername;
    localStorage.setItem('peer_usernames', JSON.stringify(storedUsernames));
    setUsername(tempUsername);
    setShowUsernamePrompt(false);
    setTempUsername('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, 'yourPassword');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Failed to log in.');
    }
  };

  // -------------------- Fetch Posts & Comments --------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });
        if (postsError) throw postsError;

        const grouped = {};
        [...userSpaces, ...adminSpaces, ...relatedCommunities].forEach(space => {
          grouped[space] = [];
        });
        postsData.forEach(p => {
          if (grouped[p.space]) grouped[p.space].push(p);
        });
        setPosts(grouped);

        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*')
          .order('created_at', { ascending: true });
        if (commentsError) throw commentsError;

        const commentsMap = {};
        commentsData.forEach(c => {
          if (!commentsMap[c.post_id]) commentsMap[c.post_id] = [];
          commentsMap[c.post_id].push(c);
        });
        setCommentsByPost(commentsMap);
      } catch (err) {
        console.error('Error loading posts/comments:', err);
      }
    };
    fetchData();
  }, []);

  // -------------------- Realtime Updates --------------------
  useEffect(() => {
    const postsChannel = supabase
      .channel('posts-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, payload => {
        const newPost = payload.new;
        setPosts(prev => ({
          ...prev,
          [newPost.space]: [newPost, ...(prev[newPost.space] || [])],
        }));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, payload => {
        const deleted = payload.old;
        setPosts(prev => ({
          ...prev,
          [deleted.space]: prev[deleted.space].filter(p => p.id !== deleted.id),
        }));
        setCommentsByPost(prev => {
          const copy = { ...prev };
          delete copy[deleted.id];
          return copy;
        });
      })
      .subscribe();

    const commentsChannel = supabase
      .channel('comments-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, payload => {
        const newComment = payload.new;
        setCommentsByPost(prev => {
          const copy = { ...prev };
          copy[newComment.post_id] = [...(copy[newComment.post_id] || []), newComment];
          return copy;
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comments' }, payload => {
        const old = payload.old;
        setCommentsByPost(prev => {
          const copy = { ...prev };
          copy[old.post_id] = (copy[old.post_id] || []).filter(c => c.id !== old.id);
          return copy;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, []);

  // -------------------- Posting --------------------
  const handlePost = async () => {
    if (!postInput.trim()) return;
    if (!isAdmin && !username) {
      setShowUsernamePrompt(true);
      return;
    }

    const user = auth.currentUser;
    const userName = isAdmin && user ? user.email : username || 'Anonymous';

    setIsPosting(true);
    try {
      const resp = await fetch(ANALYZE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: postInput }),
      });
      const analysis = resp.ok ? await resp.json() : { label: 'neutral' };
      const emotion = analysis.label || 'neutral';

      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            text: postInput,
            user_name: userName,
            emotion,
            space: activeSpace,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;
      const inserted = data?.[0];
      if (inserted) {
        setPosts(prev => ({
          ...prev,
          [activeSpace]: [inserted, ...(prev[activeSpace] || [])],
        }));
      }

      setPostInput('');
    } catch (err) {
      console.error('Failed to post:', err);
      alert('Failed to post — please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  // -------------------- CSV Upload --------------------
  const handleCSVUpload = async () => {
    if (!csvFile) return alert('Please select a CSV file.');
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      const response = await fetch(CSV_UPLOAD_URL, { method: 'POST', body: formData });
      const result = await response.json();
      alert(result.message || 'Upload successful!');
    } catch (err) {
      console.error('CSV upload error:', err);
      alert('Upload failed.');
    }
  };

  if (loading) return <div>Loading...</div>;
  const spaces = isAdmin ? adminSpaces : userSpaces;

  // -------------------- Render --------------------
  const renderCommunityPage = (community) => (
    <div className="community-page">
      <h3>{community} Community 💬</h3>
      <div className="posts-list">
        {posts[community]?.map(post => (
          <PostCard
            key={post.id}
            post={post}
            space={community}
            posts={posts}
            setPosts={setPosts}
            isAdmin={isAdmin}
            username={username}
            comments={commentsByPost[post.id] || []}
            setCommentsByPost={setCommentsByPost}
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
    if (relatedCommunities.includes(activeSpace)) return renderCommunityPage(activeSpace);
    if (activeSpace === 'Suggested Actions') return <SuggestedActions />;
    if (activeSpace === 'About Developers') return <AboutDevelopers />;
    if (activeSpace === 'About System') return <AboutSystem />;
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
              username={username}
              comments={commentsByPost[post.id] || []}
              setCommentsByPost={setCommentsByPost}
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
            <li key={space} className={space === activeSpace ? 'active' : ''} onClick={() => setActiveSpace(space)}>
              {space}
            </li>
          ))}
        </ul>
      </aside>

      <main className="main-content">
        <div className="space-header">
          <h2>{activeSpace}</h2>
          <p className="anonymous-note">Posting as: <strong>{isAdmin ? 'Admin' : username || 'Set Username'}</strong></p>
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
        <h4>Related Community</h4>
        <ul>
          {relatedCommunities.map(topic => (
            <li key={topic} className={topic === activeSpace ? 'active' : ''} onClick={() => setActiveSpace(topic)}>
              {topic}
            </li>
          ))}
        </ul>
      </aside>

      {showUsernamePrompt && (
        <div className="username-modal">
          <div className="username-modal-content">
            <h4>Enter Your Username</h4>
            <input type="text" placeholder="e.g. MindfulSoul" value={tempUsername} onChange={(e) => setTempUsername(e.target.value)} />
            <button onClick={handleSetUsername}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------- PostCard --------------------
const PostCard = ({ post, space, setPosts, isAdmin, comments = [], setCommentsByPost }) => {
  const [commentText, setCommentText] = useState('');
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [commenterUsername, setCommenterUsername] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const storedUsernames = JSON.parse(localStorage.getItem('peer_usernames') || '{}');
      if (storedUsernames[user.uid]) setCommenterUsername(storedUsernames[user.uid]);
    }
  }, []);

  const addComment = async () => {
    if (!commentText.trim()) return;
    if (!commenterUsername) {
      setShowUsernamePrompt(true);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert([{ post_id: post.id, text: commentText, user_name: commenterUsername, emotion: 'neutral', created_at: new Date().toISOString() }])
        .select();
      if (error) throw error;
      const inserted = data?.[0];
      if (inserted) {
        setCommentsByPost(prev => ({
          ...prev,
          [post.id]: [...(prev[post.id] || []), inserted],
        }));
      }
      setCommentText('');
    } catch (err) {
      console.error('Add comment error:', err);
      alert('Failed to add comment.');
    }
  };

  const handleSetUsername = () => {
    const user = auth.currentUser;
    if (!tempUsername.trim() || !user) return alert('Please enter a valid username.');
    const storedUsernames = JSON.parse(localStorage.getItem('peer_usernames') || '{}');
    storedUsernames[user.uid] = tempUsername;
    localStorage.setItem('peer_usernames', JSON.stringify(storedUsernames));
    setCommenterUsername(tempUsername);
    setShowUsernamePrompt(false);
    setTempUsername('');
  };

  const deletePost = async () => {
    if (!window.confirm('Delete this post?')) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('posts').delete().eq('id', post.id);
      if (error) throw error;
      setPosts(prev => ({
        ...prev,
        [space]: prev[space].filter(p => p.id !== post.id),
      }));
      await supabase.from('comments').delete().eq('post_id', post.id);
    } catch (err) {
      console.error('Delete post error:', err);
      alert('Failed to delete post.');
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
      setCommentsByPost(prev => ({
        ...prev,
        [post.id]: (prev[post.id] || []).filter(c => c.id !== commentId),
      }));
    } catch (err) {
      console.error('Delete comment error:', err);
      alert('Failed to delete comment.');
    }
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <span className="post-user">{post.user_name || 'Anonymous'}</span>
        <span className="post-time">{new Date(post.created_at).toLocaleString()}</span>
      </div>

      <p className="post-text">
        {post.text}
        <span className="emotion-tag"> ({post.emotion})</span>
      </p>

      {isAdmin && (
        <button className="delete-button" onClick={deletePost} disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      )}

      <div className="comment-area">
        <input type="text" placeholder="Add a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} />
        <button onClick={addComment}>Comment</button>
      </div>

      {showUsernamePrompt && (
        <div className="username-modal">
          <div className="username-modal-content">
            <h4>Enter your username</h4>
            <input type="text" placeholder="e.g. MindfulUser" value={tempUsername} onChange={(e) => setTempUsername(e.target.value)} />
            <button onClick={handleSetUsername}>Save</button>
          </div>
        </div>
      )}

      <div className="comments">
        {(comments || []).map(c => (
          <div key={c.id} className="comment">
            <p className="comment-text">
              💬 <strong>{c.user_name || 'Anonymous'}:</strong> {c.text}
            </p>
            {isAdmin && <button className="delete-comment" onClick={() => deleteComment(c.id)}>Delete</button>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PeerSupport;
