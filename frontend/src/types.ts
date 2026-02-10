export interface Comment {
    id: string;
    post_id: string;
    author_id: string;
    content: string;
    created_at: string;
    author_first_name: string;
    author_last_name: string;
}

export interface Post {
    id: string;
    type?: 'post';
    author_id: string;
    content: string;
    created_at: string;
    author_first_name: string;
    author_last_name: string;
    author_headline?: string;
    likes_count: number;
    has_liked: boolean;
    comments_count: number;
    visibility: 'public' | 'connections_only';
    club_id?: string;
    club_name?: string;
}

export interface UserProfile {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    about?: string;
    headline?: string;
}

export interface Notification {
    id: string;
    user_id: string;
    type: 'like' | 'comment' | 'connection';
    actor_id: string;
    post_id?: string;
    created_at: string;
    read_at?: string;
    actor_first_name: string;
    actor_last_name: string;
}



export interface Club {
    id: string;
    name: string;
    description: string;
    website_url?: string;
    admin_id?: string;
    created_at: string;
    updated_at: string;
    is_following?: boolean;
}

export type JobType = 'full-time' | 'part-time' | 'internship' | 'contract';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'executive';

export interface Opening {
    id: string;
    club_id: string;
    title: string;
    description: string;
    location_city: string;
    location_country: string;
    job_type: JobType;
    experience_level: ExperienceLevel;
    created_at: string;
    updated_at: string;
    club_name?: string;
}

export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    message_text: string;
    attachment_url?: string;
    created_at: string;
    read_at?: string;
    sender_first_name?: string;
    sender_last_name?: string;
}

export interface Conversation {
    other_id: string;
    first_name: string;
    last_name: string;
    message_text: string;
    created_at: string;
}

export interface FeedItem {
    id: string;
    content: string;
    created_at: string;
    type: 'post' | 'opening';
    author_first_name?: string;
    author_last_name?: string;
    author_headline?: string;
    club_name?: string;
    likes_count: number;
    has_liked: boolean;
    comments_count: number;
    // Opening specific fields
    title?: string;
    job_type?: JobType;
    experience_level?: ExperienceLevel;
    location_city?: string;
    location_country?: string;
}
