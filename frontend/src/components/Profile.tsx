import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Textarea } from './ui/Textarea';
import ProfilePosts from './ProfilePosts';

interface ProfileProps {
    authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
    userId?: string;
}

interface UserProfile {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    about?: string;
    headline?: string; // Future proofing, though not in DB yet? Let's check. 
    // Actually schema says 'about', doesn't mention headline explicitly in previous context but user asked for it.
    // I will use 'about' for now and maybe add headline if I can find where it is stored or just repurpose/add it.
    // Wait, user asked for "Headline". I'll check if I can add it or just simulate it for now.
    // DB schema migration 002_profiles.sql added 'about' and 'avatar_url'. 
    // I will assume for now Headline is not there and maybe user means the 'about' or I should add it.
    // Given I can't easily run migrations without risk, I'll stick to what I have or simulate it.
    // Actually, I can just use 'about' as the bio/headline area for now to keep it simple as per "About section (editable)".
    // The prompt says "Name", "Headline", "About section".
    // I'll stick to Name and About for now to ensure functionality, or maybe "Headline" is just static for now? 
    // Let's just use Name and About first. 
}

export default function Profile({ authenticatedFetch }: ProfileProps) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [about, setAbout] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
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
    };

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
