import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import './PeerSupport.css';

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
  const [username, setUsername] = useState('');
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // --- HANDLE USER AUTH AND USERNAME STORAGE ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setCurrentUser(user);
        setIsAdmin(user.email === 'admin@gmail.com');
        const storedUsernames = JSON.parse(localStorage.getItem('peer_usernames') || '{}');
        const userSpecificName = storedUsernames[user.uid];
        if (userSpecificName) {
          setUsername(userSpecificName);
        } else {
          setShowUsernamePrompt(true); // ask if not set
        }
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
    const storedUsernames = JSON.parse(localStorage.getItem('peer_usernames') || '{}');
    storedUsernames[currentUser.uid] = tempUsername;
    localStorage.setItem('peer_usernames', JSON.stringify(storedUsernames));
    setUsername(tempUsername);
    setShowUsernamePrompt(false);
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

  if (loading) return <div>Loading...</div>;

  const spaces = isAdmin ? adminSpaces : userSpaces;

  const handlePost = async () => {
    if (!postInput.trim()) return;
    if (!isAdmin && !username) {
      setShowUsernamePrompt(true);
      return;
    }

    const user = auth.currentUser;
    const userName = isAdmin && user ? user.email : username;
    setIsPosting(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: postInput }),
      });

      const analysis = response.ok ? await response.json() : { label: 'neutral' };
      const emotion = analysis.label || 'neutral';

      const savedPost = {
        id: Date.now(),
        text: postInput,
        userName,
        emotion,
        comments: []
      };

      setPosts(prev => ({
        ...prev,
        [activeSpace]: [savedPost, ...prev[activeSpace]],
      }));
      setPostInput('');
    } catch (error) {
      console.error('Failed to handle post:', error);
      alert('Error posting — Flask backend might be offline.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleCSVUpload = async () => {
    if (!csvFile) {
      alert('Please select a CSV file.');
      return;
    }
    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const response = await fetch('http://127.0.0.1:5000/upload_csv', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      alert(result.message || 'Upload successful!');
    } catch (error) {
      console.error('CSV upload error:', error);
      alert('Upload failed.');
    }
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

          <ul className="developer-team">
            <li>👨‍💻 <strong>Marc Rainier B. Buitizon</strong> – Lead Programmer</li>
            <li>📋 <strong>Jeffrey B. Ramirez</strong> – Project Leader</li>
            <li>🛠 <strong>Gabriela C. Enriquez</strong> – System Manager</li>
            <li>🎨 <strong>Jensha P. Maniflor</strong> – Designer</li>
          </ul>

          <p>
            Our goal is to integrate a BERT NLP model for sentiment analysis with peer support and to combine its result with a Logistic Regression Algorithm to encourage early detection 
            of psychological distress while providing a safe and anonymous platform for sharing thoughts.
          </p>
          <p className="note">
            💡 Disclaimer: This platform does not replace professional diagnosis or treatment. 
            If you’re in crisis, please seek immediate help from a licensed professional or 
            mental health hotline.
          </p>
        </div>
      );
    }

    if (activeSpace === 'About System') {
      return (
        <div className="about-system">
          <h3>🖥️ About the System</h3>
          <p>
            This system is designed to help people understand and self-evaluate their mental well-being using Artificial Intelligence. 
            There are tests for anxiety, depression, general well-being, and personality traits. 
            The scoring is analyzed via a logistic regression model to classify results by risk level. 
            An AI chatbot supports guided reflection, and peer support allows safe, anonymous sharing and encouragement.
          </p>
        </div>
      );
    }

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
          <p className="anonymous-note">
            Posting as: <strong>{isAdmin ? 'Admin' : username || 'Set Username'}</strong>
          </p>
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
            <li
              key={topic}
              className={topic === activeSpace ? 'active' : ''}
              onClick={() => setActiveSpace(topic)}
            >
              {topic}
            </li>
          ))}
        </ul>
      </aside>

      {/* Username Prompt Modal */}
      {showUsernamePrompt && (
        <div className="username-modal">
          <div className="username-modal-content">
            <h4>Enter Your Username</h4>
            <input
              type="text"
              placeholder="e.g. MindfulSoul"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
            />
            <button onClick={handleSetUsername}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- POST CARD COMPONENT ---
const PostCard = ({ post, space, posts, setPosts, isAdmin, username }) => {
  const [comment, setComment] = useState('');
  const [tempUsername, setTempUsername] = useState('');
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [commenterUsername, setCommenterUsername] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const storedUsernames = JSON.parse(localStorage.getItem('peer_usernames') || '{}');
      if (storedUsernames[user.uid]) {
        setCommenterUsername(storedUsernames[user.uid]);
      }
    }
  }, []);

  const addComment = () => {
    if (!comment.trim()) return;
    if (!commenterUsername) {
      setShowUsernamePrompt(true);
      return;
    }

    const newComment = {
      id: Date.now(),
      text: comment,
      emotion: 'neutral',
      user: commenterUsername,
    };

    const updatedPosts = posts[space].map(p =>
      p.id === post.id ? { ...p, comments: [...p.comments, newComment] } : p
    );

    setPosts({ ...posts, [space]: updatedPosts });
    setComment('');
  };

  const handleSetUsername = () => {
    const user = auth.currentUser;
    if (!tempUsername.trim() || !user) return alert('Please enter a valid username.');
    const storedUsernames = JSON.parse(localStorage.getItem('peer_usernames') || '{}');
    storedUsernames[user.uid] = tempUsername;
    localStorage.setItem('peer_usernames', JSON.stringify(storedUsernames));
    setCommenterUsername(tempUsername);
    setShowUsernamePrompt(false);
  };

  const deletePost = () => {
    setPosts(prev => ({
      ...prev,
      [space]: prev[space].filter(p => p.id !== post.id),
    }));
  };

  const deleteComment = (commentId) => {
    const updatedPosts = posts[space].map(p =>
      p.id === post.id ? { ...p, comments: p.comments.filter(c => c.id !== commentId) } : p
    );
    setPosts({ ...posts, [space]: updatedPosts });
  };

  return (
    <div className="post-card">
      <p className="post-text">
        {isAdmin && post.userName && <span className="poster-name">{post.userName}: </span>}
        {!isAdmin && <span className="poster-name">{post.userName}: </span>}
        {post.text}
        <span className="emotion-tag"> ({post.emotion})</span>
        {isAdmin && (
          <button className="delete-button" onClick={deletePost}>Delete</button>
        )}
      </p>

      <div className="comment-area">
        <input
          type="text"
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button onClick={addComment}>Comment</button>
      </div>

      {/* Username modal for comment */}
      {showUsernamePrompt && (
        <div className="username-modal">
          <div className="username-modal-content">
            <h4>Enter your username</h4>
            <input
              type="text"
              placeholder="e.g. MindfulUser"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
            />
            <button onClick={handleSetUsername}>Save</button>
          </div>
        </div>
      )}

      <div className="comments">
        {post.comments?.map(c => (
          <div key={c.id} className="comment">
            <p className="comment-text">
              💬 <strong>{c.user || 'Anonymous'}:</strong> {c.text}
              {c.emotion && <span className="emotion-tag"> ({c.emotion})</span>}
            </p>
            {isAdmin && (
              <button
                className="delete-comment"
                onClick={() => deleteComment(c.id)}
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PeerSupport;
