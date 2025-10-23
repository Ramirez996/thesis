-- ✅ Enable UUIDs (if you ever need Supabase client-generated IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

----------------------------------------------------------
-- 🧩 POSTS TABLE
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(100) DEFAULT 'Anonymous',
    space VARCHAR(50) CHECK (space IN (
        'Community Support',
        'Suggested Actions', 
        'About Developers',
        'About System',
        'Admin Dashboard',
        'User Reports',
        'System Notifications',
        'Admin Actions'
    )) NOT NULL,
    text TEXT NOT NULL,
    emotion VARCHAR(50) DEFAULT 'neutral',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

----------------------------------------------------------
-- 💬 COMMENTS TABLE
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_name VARCHAR(100) DEFAULT 'Anonymous',
    text TEXT NOT NULL,
    emotion VARCHAR(50) DEFAULT 'neutral',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

----------------------------------------------------------
-- 😰 ANXIETY TEST (GAD-7)
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS anxiety_results (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(100),
    score INTEGER NOT NULL,
    result_text VARCHAR(255) NOT NULL,
    description TEXT,
    lr_score DECIMAL(5,4),
    bert_anomaly_score DECIMAL(5,4),
    final_risk VARCHAR(100),
    is_high_risk BOOLEAN DEFAULT FALSE,
    answers_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

----------------------------------------------------------
-- 😔 DEPRESSION TEST (PHQ-9)
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS depression_results (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(100),
    score INTEGER NOT NULL,
    result_text VARCHAR(255) NOT NULL,
    description TEXT,
    lr_score DECIMAL(5,4),
    bert_anomaly_score DECIMAL(5,4),
    hybrid_risk_score DECIMAL(5,4),
    risk_level VARCHAR(100),
    is_high_risk BOOLEAN DEFAULT FALSE,
    answers_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

----------------------------------------------------------
-- 🧠 PERSONALITY TEST (BFI-10)
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS personality_results (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(100),
    extraversion INTEGER NOT NULL,
    agreeableness INTEGER NOT NULL,
    neuroticism INTEGER NOT NULL,
    openness INTEGER NOT NULL,
    conscientiousness INTEGER NOT NULL,
    hybrid_score DECIMAL(5,4),
    risk_level VARCHAR(50),
    lr_score DECIMAL(5,4),
    bert_score DECIMAL(5,4),
    is_high_risk BOOLEAN DEFAULT FALSE,
    answers_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

----------------------------------------------------------
-- 😊 WELL-BEING TEST (WHO-5)
----------------------------------------------------------
CREATE TABLE IF NOT EXISTS wellbeing_results (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(100),
    score INTEGER NOT NULL,
    percentage INTEGER GENERATED ALWAYS AS (score * 4) STORED,
    result_text VARCHAR(255) NOT NULL,
    description TEXT,
    lr_score DECIMAL(5,4),
    bert_score DECIMAL(5,4),
    hybrid_score DECIMAL(5,4),
    risk_level VARCHAR(100),
    is_high_risk BOOLEAN DEFAULT FALSE,
    answers_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

----------------------------------------------------------
-- ⚡ INDEXES FOR PERFORMANCE
----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_posts_space ON posts(space);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_name ON comments(user_name);
CREATE INDEX IF NOT EXISTS idx_anxiety_results_user_name ON anxiety_results(user_name);
CREATE INDEX IF NOT EXISTS idx_anxiety_results_created_at ON anxiety_results(created_at);
CREATE INDEX IF NOT EXISTS idx_depression_results_user_name ON depression_results(user_name);
CREATE INDEX IF NOT EXISTS idx_depression_results_created_at ON depression_results(created_at);
CREATE INDEX IF NOT EXISTS idx_personality_results_user_name ON personality_results(user_name);
CREATE INDEX IF NOT EXISTS idx_personality_results_created_at ON personality_results(created_at);
CREATE INDEX IF NOT EXISTS idx_wellbeing_results_user_name ON wellbeing_results(user_name);
CREATE INDEX IF NOT EXISTS idx_wellbeing_results_created_at ON wellbeing_results(created_at);

----------------------------------------------------------
-- 🧾 SAMPLE DATA (optional, safe to remove later)
----------------------------------------------------------
INSERT INTO posts (user_name, space, text, emotion) VALUES 
('Admin', 'Community Support', 'Welcome to our mental health support community!', 'positive'),
('System', 'About System', 'This system provides comprehensive mental health assessments.', 'neutral')
ON CONFLICT DO NOTHING;

----------------------------------------------------------
-- ✅ VERIFICATION QUERIES
----------------------------------------------------------
-- List all tables
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- Count rows
-- SELECT COUNT(*) FROM posts;
-- SELECT COUNT(*) FROM comments;
-- SELECT COUNT(*) FROM anxiety_results;
-- SELECT COUNT(*) FROM wellbeing_results;
