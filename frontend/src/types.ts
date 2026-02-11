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
    body_id?: string;
    body_name?: string;
}

export interface UserProfile {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    about?: string;
    headline?: string;
    is_system_admin: boolean;
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

export type BodyRole = 'BODY_ADMIN' | 'BODY_MANAGER' | 'BODY_MEMBER';

export interface Body {
    id: string;
    name: string;
    description: string;
    website_url?: string;
    created_at: string;
    updated_at: string;
    is_following?: boolean;
    user_role?: BodyRole | null;
}

export type JobType = 'full_time' | 'part_time' | 'internship';
export type ExperienceLevel = 'fresher' | '1-2_years' | '3+_years';

export interface Opening {
    id: string;
    body_id: string;
    title: string;
    description: string;
    location_city: string;
    location_country: string;
    job_type: JobType;
    experience_level: ExperienceLevel;
    created_at: string;
    updated_at: string;
    body_name?: string;
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
    body_name?: string;
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

export interface BodyMember {
    body_id: string;
    user_id: string;
    role: BodyRole;
    first_name: string;
    last_name: string;
    email: string;
}
