import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../api/client';

export default function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        headline: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);



    const validateForm = () => {
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
            setError('Please fill in all required fields');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            await apiClient.post('/auth/register', formData);

            // Success
            navigate('/login');
        } catch (err) {
            console.error('Registration failed', err);
            const error = err as { response?: { data?: { error?: string } } };
            const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-8">
                    <div className="flex flex-col items-center mb-6">
                        <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                            <span className="material-symbols-outlined text-2xl">person_add</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Join the community today</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">error</span>
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    First Name
                                </label>
                                <Input
                                    id="firstName"
                                    type="text"
                                    placeholder="John"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                    disabled={isLoading}
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Last Name
                                </label>
                                <Input
                                    id="lastName"
                                    type="text"
                                    placeholder="Doe"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                    disabled={isLoading}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="headline" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Headline <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <Input
                                id="headline"
                                type="text"
                                placeholder="Software Engineer at Tech Co"
                                value={formData.headline}
                                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                                disabled={isLoading}
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                disabled={isLoading}
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Min 8 characters"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                disabled={isLoading}
                                className="w-full"
                            />
                        </div>

                        <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                            {isLoading ? 'Creating Account...' : 'Sign Up'}
                        </Button>
                    </form>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 text-center border-t border-gray-100 dark:border-gray-800">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Already have an account?{' '}
                        <a href="/login" className="text-primary hover:underline font-medium">
                            Sign in
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
