import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from './ui/Button';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Textarea } from './ui/Textarea';
import ProfilePosts from './ProfilePosts';
import type { UserProfile } from '../types';

interface ProfileProps {
    authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
    currentUserId?: string;
}

export default function Profile({ authenticatedFetch, currentUserId }: ProfileProps) {
    const { id } = useParams();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [about, setAbout] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const isMe = id === 'me' || (currentUserId && id === currentUserId);

    const fetchProfileData = useCallback(async () => {
        try {
            // Get basic user info
            const meRes = await authenticatedFetch('http://localhost:3000/me');
            if (meRes.ok) {
                const meData = await meRes.json();

                // Get extended profile info
                const profileRes = await authenticatedFetch('http://localhost:3000/me/profile');
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    setProfile({ ...meData, ...profileData });
                    setAbout(profileData.about || '');
                } else {
                    setProfile(meData);
                }
            }
        } catch (error) {
            console.error('Failed to fetch profile', error);
        }
    }, [authenticatedFetch]);

    useEffect(() => {
        if (isMe) {
            fetchProfileData();
        } else {
            // TODO: Implement viewing other profiles when backend supports it
            console.log('Viewing other profile:', id);
            setProfile(null);
        }
    }, [id, currentUserId, isMe, fetchProfileData]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await authenticatedFetch('http://localhost:3000/me/profile', {
                method: 'PUT',
                body: JSON.stringify({ about })
            });
            if (res.ok) {
                setProfile(prev => prev ? { ...prev, about } : null);
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Failed to save profile', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!profile) {
        return <div className="text-center py-10">Loading profile...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header Card */}
            <Card>
                <CardContent className="pt-8 pb-8 text-center">
                    <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center text-3xl font-bold text-primary mb-4">
                        {profile.first_name?.[0]}{profile.last_name?.[0]}
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary">
                        {profile.first_name} {profile.last_name}
                    </h1>
                    <p className="text-text-muted mt-1">{profile.email}</p>

                    {/* Placeholder for "Connection status button" - currently self so maybe "Edit Profile" is better? 
                       User asked for "Connection status button". On own profile this doesn't make sense.
                       I'll put an "Edit Profile" button here if it's me.
                   */}
                    <div className="mt-4">
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                            {isEditing ? 'Cancel Editing' : 'Edit Profile'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* About Section */}
            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold">About</h2>
                </CardHeader>
                <CardContent>
                    {isEditing ? (
                        <div className="space-y-4">
                            <Textarea
                                value={about}
                                onChange={(e) => setAbout(e.target.value)}
                                placeholder="Tell us about yourself..."
                                className="min-h-[120px]"
                            />
                            <div className="flex justify-end">
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-text-primary whitespace-pre-wrap">
                            {profile.about || <span className="text-text-muted italic">No about info yet.</span>}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Posts List */}
            <div>
                <ProfilePosts authenticatedFetch={authenticatedFetch} userId={profile.id} />
            </div>
        </div>
    );
}
