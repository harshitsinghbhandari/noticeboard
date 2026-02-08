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
    author_id: string;
    content: string;
    created_at: string;
    author_first_name: string;
    author_last_name: string;
    likes_count: number;
    has_liked: boolean;
    comments_count: number;
    visibility: 'public' | 'connections_only';
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

export type AuthenticatedFetch = (url: string, options?: RequestInit) => Promise<Response>;
