import { useState } from 'react';
import type { FormEvent } from 'react';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';


interface LoginProps {
    onLogin: (token: string, refreshToken?: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Keycloak config
    const KEYCLOAK_URL = 'http://localhost:8080/realms/noticeboard/protocol/openid-connect/token';
    const CLIENT_ID = 'noticeboard-frontend';

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const params = new URLSearchParams();
        params.append('client_id', CLIENT_ID);
        params.append('grant_type', 'password');
        params.append('username', email);
        params.append('password', password);

        try {
            const response = await fetch(KEYCLOAK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params,
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error_description || 'Invalid email or password');
            }

            const data = await response.json();
            // Store token and redirect
            onLogin(data.access_token, data.refresh_token);
        } catch (err) {
            console.error('Login failed', err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Login failed. Please try again.');
            }
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
                            <span className="material-symbols-outlined text-2xl">lock</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">error</span>
                                {error}
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="text"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                className="w-full"
                            />
                        </div>
                        <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 text-center border-t border-gray-100 dark:border-gray-800">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Don't have an account?{' '}
                        <a href="/register" className="text-primary hover:underline font-medium">
                            Sign up
                        </a>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Protected by Keycloak Identity Server
                    </p>
                </div>
            </div>
        </div>
    );
}
