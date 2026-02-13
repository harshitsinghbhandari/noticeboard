import { useState, useEffect } from 'react';
import type { UserProfile } from '../../../types';
import * as messagesApi from '../api/messages';
import { Button } from '../../../components/ui/Button';
import apiClient from '../../../api/client';

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGroupCreated: () => void;
    initialMembers?: UserProfile[];
}

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated, initialMembers = [] }: CreateGroupModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedMembers(initialMembers);
            setName('');
            setDescription('');
        }
    }, [isOpen, initialMembers]);

    useEffect(() => {
        if (searchQuery.length >= 2) {
            const timeoutId = setTimeout(() => {
                apiClient.get(`/users/search?q=${searchQuery}`)
                    .then(res => setSearchResults(res.data))
                    .catch(err => console.error("Search failed", err));
            }, 300);
            return () => clearTimeout(timeoutId);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const handleAddMember = (user: UserProfile) => {
        if (!selectedMembers.find(m => m.id === user.id)) {
            setSelectedMembers([...selectedMembers, user]);
        }
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleRemoveMember = (userId: string) => {
        setSelectedMembers(selectedMembers.filter(m => m.id !== userId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validation
        if (!name.trim()) {
            setError('Group name is required');
            setLoading(false);
            return;
        }
        if (selectedMembers.length === 0) {
            setError('Please select at least one member');
            setLoading(false);
            return;
        }

        try {
            await messagesApi.createGroup(
                name,
                description,
                selectedMembers.map(m => m.id)
            );
            onGroupCreated();
            onClose();
            // Reset form
            setName('');
            setDescription('');
            setSelectedMembers([]);
        } catch (err) {
            console.error('Failed to create group', err);
            const axiosError = err as { response?: { data?: { error?: string } } };
            setError(axiosError.response?.data?.error || 'Failed to create group');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto text-black">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Create New Group</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="e.g. Project Alpha"
                            maxLength={50}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="What is this group about?"
                            rows={2}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Add Members</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Search users..."
                            />
                            {searchResults.length > 0 && (
                                <div className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded shadow-lg max-h-48 overflow-y-auto">
                                    {searchResults.map(user => (
                                        <div
                                            key={user.id}
                                            onClick={() => handleAddMember(user)}
                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                        >
                                            <div className="font-bold">{user.first_name} {user.last_name}</div>
                                            <div className="text-gray-500 text-xs">{user.email}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedMembers.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {selectedMembers.map(member => (
                                <div key={member.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                                    <span>{member.first_name} {member.last_name}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveMember(member.id)}
                                        className="hover:text-blue-900"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-6">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Group'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
