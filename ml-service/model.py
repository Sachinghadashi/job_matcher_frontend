import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Load dataset configuration
MONGO_URI = os.getenv('MONGO_URI')

def load_jobs():
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI)
        # Explicitly select the database from the URI or fallback to 'jobmatcher'
        db = client.get_database() 
        
        # Fetch all jobs from the 'jobs' collection
        jobs_collection = db['jobs']
        jobs_list = list(jobs_collection.find())
        
        if not jobs_list:
            print("Database connected, but no jobs found in 'jobs' collection.")
            return pd.DataFrame()
            
        # Convert to DataFrame
        df = pd.DataFrame(jobs_list)
        
        # IMPORTANT: Convert ObjectId to string for JSON serialization later
        if '_id' in df.columns:
            df['_id'] = df['_id'].apply(str)
            
        # Ensure job_id is string
        if 'job_id' in df.columns:
            df['job_id'] = df['job_id'].astype(str)
            
        return df
    except Exception as e:
        print(f"Error loading data from MongoDB: {e}")
        return pd.DataFrame()

def get_job_recommendations(user_skills, top_n=5):
    df = load_jobs()
    if df.empty:
        return []

    # Prepare user query
    user_skills_str = " ".join(user_skills).lower()

    # Convert job skill lists to strings for vectorization
    job_skills_strings = df['skills_required'].apply(lambda x: " ".join(x) if isinstance(x, list) else str(x)).fillna('').tolist()

    # Combine user skills with job skills for vectorization
    all_skills = [user_skills_str] + job_skills_strings

    vectorizer = TfidfVectorizer().fit_transform(all_skills)
    vectors = vectorizer.toarray()

    # The first vector is the user, the rest are jobs
    user_vector = vectors[0]
    job_vectors = vectors[1:]

    # Calculate cosine similarity
    cosine_sim = cosine_similarity([user_vector], job_vectors)[0]

    # Add similarity scores to dataframe
    df['similarity_score'] = cosine_sim

    # Sort by score descending and take top N
    recommended_jobs = df.sort_values(by='similarity_score', ascending=False).head(top_n)

    # Filter out jobs with 0 similarity if we strictly want matches
    recommended_jobs = recommended_jobs[recommended_jobs['similarity_score'] > 0]

    # Convert to dict for JSON serialization
    # Drop similarity if you don't want to show it, or keep it.
    results = recommended_jobs.to_dict(orient='records')
    return results
