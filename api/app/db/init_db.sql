-- Tailored Resume Intelligence Platform SQL Migration Script
-- PostgreSQL 15+ with pgvector extension enabled

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Master Experiences
CREATE TABLE IF NOT EXISTS master_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    role_title TEXT NOT NULL,
    location TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE NOT NULL,
    raw_summary TEXT,
    skills_used TEXT[] DEFAULT '{}',
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Master Achievements (Granular Entity Records)
CREATE TABLE IF NOT EXISTS master_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id UUID NOT NULL REFERENCES master_experiences(id) ON DELETE CASCADE,
    raw_bullet TEXT NOT NULL,
    quantified_metric JSONB DEFAULT '{}'::jsonb,
    action_verb TEXT,
    context TEXT,
    vector_tags TEXT[] DEFAULT '{}',
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Target Job Descriptions
CREATE TABLE IF NOT EXISTS target_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT,
    location TEXT,
    raw_description TEXT NOT NULL,
    parsed_hard_skills TEXT[] DEFAULT '{}',
    parsed_soft_skills TEXT[] DEFAULT '{}',
    parsed_responsibilities TEXT[] DEFAULT '{}',
    parsed_metrics TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Elicitation Sessions (Dynamic Micro-Interviews)
CREATE TABLE IF NOT EXISTS elicitation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_job_id UUID NOT NULL REFERENCES target_jobs(id) ON DELETE CASCADE,
    missing_skill_or_gap TEXT NOT NULL,
    generated_question TEXT NOT NULL,
    user_response TEXT,
    synthesized_bullet TEXT,
    status TEXT CHECK (status IN ('PENDING', 'ANSWERED', 'SKIPPED')) DEFAULT 'PENDING' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Generated Single-Column Resumes
CREATE TABLE IF NOT EXISTS generated_resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_job_id UUID NOT NULL REFERENCES target_jobs(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    document_json JSONB NOT NULL,
    pdf_url TEXT,
    docx_url TEXT,
    ats_score INTEGER DEFAULT 85,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Vector Similarity Indexes (IVFFLAT & HNSW)
CREATE INDEX IF NOT EXISTS idx_master_experiences_embedding 
ON master_experiences USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_master_achievements_embedding 
ON master_achievements USING ivfflat (embedding vector_cosine_ops);
