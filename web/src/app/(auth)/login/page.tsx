'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      login(res.data.access_token);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col pt-12 px-6 bg-white">
      {/* Decorative Top - Mimicking the Figma graphic */}
      <div className="w-full flex justify-center mb-12">
        <svg width="200" height="100" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 50 Q 50 100 100 50 T 200 50" stroke="#0d9488" strokeWidth="6" strokeDasharray="12 12" fill="none" strokeLinecap="round"/>
        </svg>
      </div>

      <div className="space-y-2 mb-10 text-center">
        <h1 className="text-5xl font-black tracking-tight text-[#111827]">HITCH</h1>
        <p className="text-lg text-gray-600 font-medium">Safe and Affordable Carpooling</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-semibold text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <input
          type="email"
          placeholder="Email Address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
        />
        <div className="pt-4 space-y-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Authenticating...' : 'Login'}
          </button>
          <Link href="/signup" className="btn-secondary">
            Register Account
          </Link>
        </div>
      </form>

      <p className="text-center text-xs text-gray-500 mt-auto pb-8">
        By continuing you agree to Hitch's <br />
        <a href="#" className="text-[#0d9488] underline font-semibold">Terms of Use</a> and <a href="#" className="text-[#0d9488] underline font-semibold">Privacy Policy</a>
      </p>
    </div>
  );
}