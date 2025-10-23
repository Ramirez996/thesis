import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import './PeerSupport.css';
import { supabase } from '../supabaseClient'; // <-- Add this line

const PostCard = ({ post, space, posts, setPosts, isAdmin }) => {
    // Basic placeholder for the card structure. You can expand this later.
    return (
        <div className={`post-card ${post.emotion}`}>
            <div className="post-header">
                <span className="post-user">{post.user_name}</span>
                <span className="post-time">
                    {new Date(post.created_at).toLocaleString()}
                </span>
            </div>
            <p className="post-text">{post.text}</p>
            <div className="post-footer">
                <span className="post-emotion">Emotion: {post.emotion}</span>
                {/* Add comment counts or admin actions here */}
            </div>
        </div>
    );
};

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

  // 1️⃣ Add this useEffect to load posts from Supabase
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Group posts by their space name
        const grouped = {};
        [...userSpaces, ...adminSpaces, ...relatedCommunities].forEach(space => {
          grouped[space] = [];
        });
        data.forEach(post => {
          if (grouped[post.space]) {
            grouped[post.space].push(post);
          }
        });

        setPosts(grouped);
      } catch (error) {
        console.error('Error loading posts:', error);
      }
    };

    fetchPosts();
  }, []); // This only runs once when the component mounts

  useEffect(() => {
  const channel = supabase
    .channel('posts-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'posts' },
      payload => {
        setPosts(prev => ({
          ...prev,
          [payload.new.space]: [payload.new, ...(prev[payload.new.space] || [])],
        }));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
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
      // Step 1️⃣ — Send text to your Flask backend (Railway)
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

      // Step 3️⃣ — Add to local state (so it appears instantly)
      setPosts(prev => ({
        ...prev,
        [activeSpace]: [data[0], ...prev[activeSpace]],
      }));

      setPostInput('');
    } catch (error) {
      console.error('Failed to post:', error);
      alert('Failed to post — please try again.');
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
