import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os
from pymongo import MongoClient

# Load dataset configuration
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/job-matcher')

def load_jobs():
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI)
        db = client.get_default_database()
        
        # Fetch all jobs from the 'jobs' collection
        jobs_collection = db['jobs']
        jobs_list = list(jobs_collection.find())
        
        if not jobs_list:
            print("No jobs found in database.")
            return pd.DataFrame()
            
        # Convert to DataFrame
        df = pd.DataFrame(jobs_list)
        
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

    # We will compute similarities between user_skills_str and all job skills
    # Combine user skills with job skills for vectorization
    all_skills = [user_skills_str] + df['skills_required'].fillna('').tolist()

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
