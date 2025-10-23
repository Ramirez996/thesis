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

// ✅ Categories (replaces Related Communities)
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
    const user = auth.currentUser;
    const userName = isAdmin && user ? user.email : 'Anonymous';

    setIsPosting(true);

    try {
        // ✅ Send the post text to your Flask backend
        const response = await fetch('http://localhost:5000/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: postInput }),
        });

        const analysis = await response.json();
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
        alert('Error posting or analyzing text.');
    } finally {
        setIsPosting(false);
    }
};

  const handleCSVUpload = async () => {
    if (!csvFile) {
      alert('Please select a CSV file.');
      return;
    }
    alert('CSV upload simulated — replace with backend endpoint.');
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

          <ul className="developer-team">
            <li>👨‍💻 <strong>Marc Rainier B. Buitizon</strong> – Lead Programmer</li>
            <li>📋 <strong>Jeffrey B. Ramirez</strong> – Project Leader</li>
            <li>🛠 <strong>Gabriela C. Enriquez</strong> – System Manager</li>
            <li>🎨 <strong>Jensha P. Maniflor</strong> – Designer</li>
          </ul>

          <p>
            Our goal is to integrate a BERT NLP model for sentiment analysis with peer support, combining its results with a Logistic Regression Algorithm to encourage early detection 
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
            It includes tests for anxiety, depression, well-being, and personality. 
            Results are analyzed via a logistic regression model to classify risk levels. 
            An AI chatbot supports guided reflection, and peer support enables safe, anonymous sharing.
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

      {/* ✅ Categories Sidebar */}
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

const PostCard = ({ post, space, posts, setPosts, isAdmin }) => {
  const [comment, setComment] = useState('');

  const addComment = () => {
    if (!comment.trim()) return;

    const newComment = {
      id: Date.now(),
      text: comment,
      emotion: 'neutral',
    };

    const updatedPosts = posts[space].map(p =>
      p.id === post.id ? { ...p, comments: [...p.comments, newComment] } : p
    );

    setPosts({ ...posts, [space]: updatedPosts });
    setComment('');
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
        {isAdmin && post.userName && <span className="poster-name">{post.userName}:</span>}
        {!isAdmin && 'Anonymous:'} {post.text}
        <span className={`emotion-tag ${post.emotion.toLowerCase()}`}>({post.emotion})</span>
        <button className='delete-button' onClick={deletePost}>Delete</button>
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
      <div className="comments">
        {post.comments?.map(c => (
          <div key={c.id} className="comment">
            <p className="comment-text">
              💬 {c.text}
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
