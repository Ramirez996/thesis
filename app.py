from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModel
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.optim import AdamW
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from torch.utils.data import DataLoader, Dataset
from sklearn.utils import shuffle
import psycopg2
import psycopg2.extras
import os
import numpy as np
import json

# ---------------- Flask + CORS ----------------
app = Flask(__name__)
CORS(app, 
     origins=[
         "http://localhost:3000", 
         "http://localhost:5173", 
         "https://*.vercel.app",
         os.getenv("FRONTEND_URL", "*")
     ],
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)

# ---------------- BERT Model ----------------
MODEL_NAME = "google-bert/bert-base-uncased"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

CHECKPOINT_DIR = "checkpoints"
CHECKPOINT_FILE = os.path.join(CHECKPOINT_DIR, "emotion_classifier_checkpoint.pth")
os.makedirs(CHECKPOINT_DIR, exist_ok=True)

training_status = {"status": "idle", "epoch": 0, "loss": None}
model = None
label_encoder = LabelEncoder()

# ---------------- Database Connection ----------------
def get_db_connection():
    try:
        database_url = os.getenv("DATABASE_URL")
        if database_url:
            connection = psycopg2.connect(database_url, sslmode='require')
        else:
            connection = psycopg2.connect(
                host=os.getenv("DB_HOST", "localhost"),
                user=os.getenv("DB_USER", "postgres"),
                password=os.getenv("DB_PASSWORD", ""),
                database=os.getenv("DB_NAME", "postgres"),
                port=int(os.getenv("DB_PORT", "5432")),
                sslmode='require'
            )
        connection.autocommit = True
        return connection
    except psycopg2.Error as err:
        print(f"Database connection error: {err}")
        return None

db = get_db_connection()
cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) if db else None

def ensure_db_connection():
    global db, cursor
    if db is None or db.closed:
        db = get_db_connection()
        cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor) if db else None
    return db, cursor

# ---------------- Dataset & Model ----------------
class EmotionDataset(Dataset):
    def __init__(self, texts, labels):
        self.texts = texts
        self.labels = labels

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        encoding = tokenizer(self.texts[idx], return_tensors='pt',
                             truncation=True, padding='max_length', max_length=128)
        input_ids = encoding['input_ids'].squeeze(0)
        attention_mask = encoding['attention_mask'].squeeze(0)
        return {
            'input_ids': input_ids,
            'attention_mask': attention_mask,
            'label': torch.tensor(self.labels[idx], dtype=torch.long)
        }

class EmotionClassifier(nn.Module):
    def __init__(self, num_labels):
        super(EmotionClassifier, self).__init__()
        self.bert = AutoModel.from_pretrained(MODEL_NAME)
        self.dropout = nn.Dropout(0.3)
        self.classifier = nn.Linear(self.bert.config.hidden_size, num_labels)
        self.anomaly_head = nn.Linear(self.bert.config.hidden_size, 1)

    def forward(self, input_ids, attention_mask, labels=None, anomaly=False):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        cls_output = outputs.last_hidden_state[:, 0]

        if anomaly:
            score = torch.sigmoid(self.anomaly_head(self.dropout(cls_output)))
            return {"anomaly_score": score}

        logits = self.classifier(self.dropout(cls_output))
        loss = F.cross_entropy(logits, labels) if labels is not None else None
        return {"logits": logits, "loss": loss}

# ---------------- Helper Functions ----------------
def load_model():
    global model
    if model is None:
        if os.path.exists(CHECKPOINT_FILE):
            checkpoint = torch.load(CHECKPOINT_FILE, map_location=device)
            num_labels = checkpoint.get('num_labels', len(checkpoint['label_encoder_classes']))
            model = EmotionClassifier(num_labels).to(device)
            model.load_state_dict(checkpoint['model_state_dict'])
            label_encoder.classes_ = checkpoint['label_encoder_classes']
    return model

def analyze_text(text):
    model = load_model()
    if model is None:
        return {"label": "neutral"}

    model.eval()
    with torch.no_grad():
        inputs = tokenizer(text, return_tensors='pt', truncation=True,
                           padding='max_length', max_length=128)
        input_ids = inputs['input_ids'].to(device)
        attention_mask = inputs['attention_mask'].to(device)

        output = model(input_ids=input_ids, attention_mask=attention_mask)
        logits = output['logits']
        probs = F.softmax(logits, dim=-1)
        top_prob, top_idx = torch.max(probs, dim=1)
        predicted_label = label_encoder.inverse_transform([top_idx.item()])[0]

    return {"label": predicted_label, "score": round(top_prob.item(), 4)}

# ---------------- GAD-7 / Anxiety ----------------
GAD7_WEIGHTS = np.array([0.5,0.7,0.6,0.4,0.6,0.5,0.8])
GAD7_INTERCEPT = -1.5

@app.route('/gad7_risk', methods=['POST'])
def gad7_risk():
    data = request.get_json()
    user_name = data.get("user_name", "Anonymous")
    answers = data.get("answers", [])
    text = data.get("text","")

    probability = data.get("lr_score")
    if not probability and answers:
        features = np.array(answers)
        logit = np.dot(features, GAD7_WEIGHTS) + GAD7_INTERCEPT
        probability = 1/(1+np.exp(-logit))

    anomaly_score = 0.0
    if text:
        bert_model = load_model()
        if bert_model:
            bert_model.eval()
            with torch.no_grad():
                encoding = tokenizer(text, return_tensors='pt', truncation=True, padding='max_length', max_length=128)
                input_ids = encoding['input_ids'].to(device)
                attention_mask = encoding['attention_mask'].to(device)
                anomaly_output = bert_model(input_ids, attention_mask, anomaly=True)
                anomaly_score = anomaly_output["anomaly_score"].item()

    hybrid_score = (probability + anomaly_score)/2
    risk_level = "High" if hybrid_score >= 0.5 else "Low"

    # non-blck
    try:
        db_conn, cursor_conn = ensure_db_connection()
        if db_conn and cursor_conn:
            cursor_conn.execute("""
                INSERT INTO anxiety_results (user_name, score, result_text, description, lr_score, bert_anomaly_score, final_risk, is_high_risk, answers_json)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """, (
                user_name,
                int(sum(answers)) if answers else 0,
                risk_level,
                "Hybrid GAD-7 + BERT analysis",
                round(probability,4),
                round(anomaly_score,4),
                risk_level,
                risk_level=="High",
                json.dumps(answers)
            ))
            db_conn.commit()
    except Exception as e:
        print(f"Database error in GAD-7: {e}")

    return jsonify({
        "lr_score": round(probability,4),
        "bert_anomaly_score": round(anomaly_score,4),
        "final_risk": round(hybrid_score,4),
        "is_high_risk": risk_level=="High"
    })

# ---------------- PHQ-9 / Depression ----------------
PHQ9_WEIGHTS = np.array([0.6,0.8,0.5,0.7,0.4,0.9,0.6,0.5,1.0])
PHQ9_INTERCEPT = -2.0

@app.route('/phq9_risk', methods=['POST'])
def phq9_risk():
    data = request.get_json()
    user_name = data.get("user_name","Anonymous")
    answers = data.get("answers")
    text = data.get("text","")

    if not answers or len(answers)!=9:
        return jsonify({"error":"Answers must be a list of 9 numbers"}),400

    features = np.array(answers)
    logit = np.dot(features, PHQ9_WEIGHTS) + PHQ9_INTERCEPT
    probability = 1/(1+np.exp(-logit))
    risk_level = "High" if probability>=0.5 else "Low"

    anomaly_score = 0.0
    if text:
        bert_model = load_model()
        if bert_model:
            bert_model.eval()
            with torch.no_grad():
                encoding = tokenizer(text, return_tensors='pt', truncation=True,
                                     padding='max_length', max_length=128)
                input_ids = encoding['input_ids'].to(device)
                attention_mask = encoding['attention_mask'].to(device)
                anomaly_output = bert_model(input_ids, attention_mask, anomaly=True)
                anomaly_score = anomaly_output["anomaly_score"].item()

    hybrid_score = (probability+anomaly_score)/2

    cursor.execute("""
    INSERT INTO depression_results (
        user_name, score, result_text, description, 
        lr_score, bert_anomaly_score, hybrid_risk_score, 
        risk_level, is_high_risk, answers_json
    )
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
""", (
    user_name,
    int(sum(answers)),
    risk_level,
    "PHQ-9 Depression + BERT analysis",
    round(probability,4),
    round(anomaly_score,4),
    round(hybrid_score,4),
    risk_level,
    risk_level=="High",
    json.dumps(answers)
))

    db.commit()

    return jsonify({
        "lr_score": round(probability,4),
        "bert_score": round(anomaly_score,4),
        "hybrid_risk_score": round(hybrid_score,4),
        "risk_level": risk_level,
        "is_high_risk": risk_level=="High"
    })

# ---------------- Personality Test ----------------
@app.route('/bfi10_risk', methods=['POST'])
def bfi10_risk():
    data = request.get_json()
    user_name = data.get("user_name", "Anonymous")
    answers = data.get("answers", [])
    traits = data.get("traits", {})
    lr_score = data.get("lr_score")
    text = data.get("text", "")

    extraversion = traits.get("Extraversion", 0)
    agreeableness = traits.get("Agreeableness", 0)
    neuroticism = traits.get("Neuroticism", 0)
    openness = traits.get("Openness", 0)
    conscientiousness = traits.get("Conscientiousness", 0)

    bert_anomaly_score = 0.0
    bert_model = load_model()
    if text and bert_model:
        bert_model.eval()
        with torch.no_grad():
            encoding = tokenizer(text, return_tensors="pt", truncation=True, padding="max_length", max_length=128)
            input_ids = encoding["input_ids"].to(device)
            attention_mask = encoding["attention_mask"].to(device)
            anomaly_output = bert_model(input_ids, attention_mask, anomaly=True)
            bert_anomaly_score = anomaly_output["anomaly_score"].item()

    if lr_score is None:
        lr_score = 0.0
    hybrid_score = (lr_score + bert_anomaly_score) / 2
    risk_level = "High" if hybrid_score >= 0.5 else "Low"
    is_high_risk = risk_level == "High"

    cursor.execute("""
        INSERT INTO personality_results (
            user_name, extraversion, agreeableness, neuroticism, openness, conscientiousness,
            hybrid_score, risk_level, lr_score, bert_score, is_high_risk, answers_json
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        user_name, extraversion, agreeableness, neuroticism, openness, conscientiousness,
        round(hybrid_score, 4), risk_level, round(lr_score, 4), round(bert_anomaly_score, 4),
        is_high_risk, json.dumps(answers)
    ))
    db.commit()

    return jsonify({
        "extraversion": extraversion,
        "agreeableness": agreeableness,
        "neuroticism": neuroticism,
        "openness": openness,
        "conscientiousness": conscientiousness,
        "lr_score": round(lr_score, 4),
        "bert_anomaly_score": round(bert_anomaly_score, 4),
        "hybrid_score": round(hybrid_score, 4),
        "risk_level": risk_level,
        "is_high_risk": is_high_risk
    })

# ---------------- WHO-5 Well-Being ----------------
WHO5_WEIGHTS = np.array([0.6, 0.7, 0.5, 0.8, 0.6])
WHO5_INTERCEPT = -1.2

@app.route('/who5_risk', methods=['POST'])
def who5_risk():
    data = request.get_json()
    user_name = data.get("user_name", "Anonymous")
    answers = data.get("answers", [])
    score = data.get("score", 0)
    result_text = data.get("result_text", "")
    description = data.get("description", "")

    answers_list = list(answers.values()) if isinstance(answers, dict) else answers
    features = np.array([int(a) if isinstance(a, (int, float)) else 0 for a in answers_list])
    logit = np.dot(features, WHO5_WEIGHTS) + WHO5_INTERCEPT
    lr_score = 1 / (1 + np.exp(-logit))

    bert_score = 0.0
    text = data.get("text", " ".join(map(str, answers_list)))
    bert_model = load_model()
    if text and bert_model:
        bert_model.eval()
        with torch.no_grad():
            encoding = tokenizer(text, return_tensors="pt", truncation=True,
                                 padding="max_length", max_length=128)
            input_ids = encoding["input_ids"].to(device)
            attention_mask = encoding["attention_mask"].to(device)
            anomaly_output = bert_model(input_ids, attention_mask, anomaly=True)
            bert_score = anomaly_output["anomaly_score"].item()

    hybrid_score = (lr_score + bert_score) / 2
    risk_level = "High" if hybrid_score >= 0.5 else "Low"
    is_high_risk = risk_level == "High"

    cursor.execute("""
        INSERT INTO wellbeing_results (
            user_name, score, result_text, description,
            lr_score, bert_score, hybrid_score,
            risk_level, is_high_risk, answers_json
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        user_name, score, result_text, description,
        round(lr_score, 4), round(bert_score, 4), round(hybrid_score, 4),
        risk_level, is_high_risk, json.dumps(answers)
    ))
    db.commit()

    return jsonify({
        "score": score,
        "lr_score": round(lr_score, 4),
        "bert_score": round(bert_score, 4),
        "hybrid_score": round(hybrid_score, 4),
        "risk_level": risk_level,
        "is_high_risk": is_high_risk
    })

# ---------------- Posts & Comments ----------------
@app.route('/posts/<space>', methods=['GET'])
def get_posts(space):
    cursor.execute("SELECT * FROM posts WHERE space=%s ORDER BY created_at DESC",(space,))
    posts = cursor.fetchall()
    for post in posts:
        cursor.execute("SELECT * FROM comments WHERE post_id=%s ORDER BY created_at ASC",(post['id'],))
        post['comments'] = cursor.fetchall()
    return jsonify(posts)

@app.route('/posts', methods=['POST'])
def create_post():
    data = request.get_json()
    text = data.get("text","")
    space = data.get("space","Community Support")
    emotion = analyze_text(text).get("label","neutral")

    cursor.execute("INSERT INTO posts (space,text,emotion) VALUES (%s,%s,%s) RETURNING id",(space,text,emotion))
    post_id = cursor.fetchone()['id']
    db.commit()
    return jsonify({"id":post_id,"space":space,"text":text,"emotion":emotion,"comments":[]})

@app.route('/posts/<int:post_id>/comments', methods=['POST'])
def add_comment(post_id):
    data = request.get_json()
    text = data.get("text","")
    emotion = analyze_text(text).get("label","neutral")

    cursor.execute("INSERT INTO comments (post_id,text,emotion) VALUES (%s,%s,%s) RETURNING id",(post_id,text,emotion))
    comment_id = cursor.fetchone()['id']
    db.commit()
    return jsonify({"id":comment_id,"post_id":post_id,"text":text,"emotion":emotion})

@app.route('/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    cursor.execute("DELETE FROM posts WHERE id=%s",(post_id,))
    db.commit()
    return jsonify({"message":"Post deleted"})

@app.route('/comments/<int:comment_id>', methods=['DELETE'])
def delete_comment(comment_id):
    cursor.execute("DELETE FROM comments WHERE id=%s",(comment_id,))
    db.commit()
    return jsonify({"message":"Comment deleted"})

# ---------------- Training ----------------
@app.route('/train', methods=['POST'])
def train():
    global model, label_encoder, training_status
    training_status["status"]="training"
    try:
    
        df = pd.read_csv("emotion_dataset.csv")
        df = shuffle(df)

        label_encoder.fit(df['label'])
        labels = label_encoder.transform(df['label'])
        dataset = EmotionDataset(df['text'].tolist(), labels)
        dataloader = DataLoader(dataset, batch_size=8, shuffle=True)

        model = EmotionClassifier(len(label_encoder.classes_)).to(device)
        optimizer = AdamW(model.parameters(), lr=2e-5)

        for epoch in range(5):
            model.train()
            total_loss = 0
            for batch in dataloader:
                input_ids = batch['input_ids'].to(device)
                attention_mask = batch['attention_mask'].to(device)
                labels_batch = batch['label'].to(device)

                output = model(input_ids, attention_mask, labels_batch)
                loss = output['loss']

                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                total_loss += loss.item()

            training_status.update({"epoch":epoch+1,"loss":total_loss})

        torch.save({
            'model_state_dict':model.state_dict(),
            'label_encoder_classes':label_encoder.classes_,
            'num_labels':len(label_encoder.classes_)
        }, CHECKPOINT_FILE)

        training_status["status"]="completed"
        return jsonify({"message":"Training complete","loss":total_loss})
    except Exception as e:
        training_status["status"]="error"
        return jsonify({"error":str(e)}),500

@app.route('/training_status', methods=['GET'])
def get_training_status():
    return jsonify(training_status)

# ---------------- Health Check ----------------
@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "message": "Mental Health System API is running",
        "version": "1.0.0"
    })

@app.route('/health', methods=['GET'])
def health():
    db_status = "disconnected"
    try:
        db_conn, _ = ensure_db_connection()
        if db_conn and not db_conn.closed:
            db_status = "connected"
    except Exception as e:
        print(f"Health check database error: {e}")
    
    return jsonify({
        "status": "healthy",
        "database": db_status,
        "model_loaded": model is not None,
        "environment": os.getenv("RAILWAY_ENVIRONMENT", "development")
    })

@app.route('/debug-db', methods=['GET'])
def debug_db():
    """Debug endpoint to show detailed database connection information"""
    debug_info = {
        "environment_vars": {
            "DATABASE_URL": "***" if os.getenv("DATABASE_URL") else None,
            "DB_HOST": os.getenv("DB_HOST"),
            "DB_USER": os.getenv("DB_USER"),
            "DB_NAME": os.getenv("DB_NAME"),
            "DB_PORT": os.getenv("DB_PORT"),
            "DB_SSL_DISABLED": os.getenv("DB_SSL_DISABLED")
        },
        "connection_attempt": "failed",
        "error": None
    }
    
    try:
        database_url = os.getenv("DATABASE_URL")
        if database_url:
            connection = psycopg2.connect(database_url, sslmode='require')
            debug_info["connection_method"] = "DATABASE_URL"
        else:
            connection = psycopg2.connect(
                host=os.getenv("DB_HOST", "localhost"),
                user=os.getenv("DB_USER", "postgres"),
                password=os.getenv("DB_PASSWORD", ""),
                database=os.getenv("DB_NAME", "postgres"),
                port=int(os.getenv("DB_PORT", "5432")),
                sslmode='require'
            )
            debug_info["connection_method"] = "individual_vars"
        
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        cursor.close()
        connection.close()
        
        debug_info["connection_attempt"] = "success"
        debug_info["test_query"] = "passed"
        
    except Exception as e:
        debug_info["error"] = str(e)
        debug_info["error_type"] = type(e).__name__
    
    return jsonify(debug_info)

@app.route('/test-dataset', methods=['GET'])
def test_dataset():
    """Test endpoint to check if dataset loads properly"""
    try:
        import pandas as pd
        df = pd.read_csv("emotion_dataset.csv")
        return jsonify({
            "status": "success",
            "rows": len(df),
            "columns": list(df.columns),
            "sample": df.head(3).to_dict('records'),
            "labels": df['label'].value_counts().to_dict()
        })
    except Exception as e:
        return jsonify({
            "status": "error", 
            "error": str(e),
            "error_type": type(e).__name__
        })

# ---------------- Analyze Text ----------------
@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    text = data.get("text", "").strip()

    if not text:
        return jsonify({"error": "Text is required"}), 400

    result = analyze_text(text)
    return jsonify(result)

# ---------------- Main ----------------
if __name__=="__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
