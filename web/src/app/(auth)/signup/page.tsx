'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/types';

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.PASSENGER);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/auth/signup', { name, email, password, role });
      login(res.data.access_token);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-8 py-8">
      <div className="border-[0.5px] border-black/30 p-8 bg-white rounded-none space-y-6">
        <div className="border-b-[0.5px] border-black/20 pb-4">
          <h2 className="text-2xl font-bold tracking-tighter">REGISTER ACCOUNT</h2>
          <p className="font-mono text-xs text-black/50 uppercase mt-1">
            CREATE NEW SYSTEM IDENTITY
          </p>
        </div>

        {error && (
          <div className="border-[0.5px] border-red-600 bg-red-50 p-4 font-mono text-xs text-red-600 uppercase">
            ERROR: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="font-mono text-xs uppercase tracking-widest text-black/60">
              FULL NAME
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-[0.5px] border-black/30 p-3 font-mono text-sm bg-[#F9F9F9] focus:outline-none focus:border-black"
            />
          </div>

          <div className="space-y-1">
            <label className="font-mono text-xs uppercase tracking-widest text-black/60">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-[0.5px] border-black/30 p-3 font-mono text-sm bg-[#F9F9F9] focus:outline-none focus:border-black"
            />
          </div>

          <div className="space-y-1">
            <label className="font-mono text-xs uppercase tracking-widest text-black/60">
              PASSWORD
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-[0.5px] border-black/30 p-3 font-mono text-sm bg-[#F9F9F9] focus:outline-none focus:border-black"
            />
          </div>

          <div className="space-y-1">
            <label className="font-mono text-xs uppercase tracking-widest text-black/60">
              SYSTEM ROLE
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full border-[0.5px] border-black/30 p-3 font-mono text-sm bg-[#F9F9F9] focus:outline-none focus:border-black"
            >
              <option value={UserRole.PASSENGER}>PASSENGER</option>
              <option value={UserRole.DRIVER}>DRIVER</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-black text-white font-mono text-xs tracking-widest uppercase hover:bg-black/80 transition-colors disabled:opacity-50"
          >
            {loading ? 'REGISTERING...' : 'REGISTER IDENTITY →'}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link href="/login" className="font-mono text-xs text-black/60 underline hover:text-black">
            ALREADY REGISTERED? LOG IN HERE
          </Link>
        </div>
      </div>
    </div>
  );
}