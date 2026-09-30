'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function LandingPage() {
  const { user, logout } = useAuth();
  
  return (
    <div className="flex-1 flex flex-col items-center pt-24 px-6 w-full max-w-3xl mx-auto">
      <div className="space-y-4 mb-12 text-center w-full">
        <h1 className="text-6xl font-black tracking-tight text-[#111827]">HITCH</h1>
        <p className="text-xl text-gray-600 font-medium">Safe and Affordable Carpooling</p>
      </div>
      
      <div className="bg-white p-10 rounded-3xl border border-gray-200 shadow-sm space-y-8 w-full">
        {user ? (
          <div className="space-y-8">
            <div className="text-center pb-8 border-b border-gray-100">
              <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-2">Active Identity</p>
              <p className="font-bold text-2xl">{user.email}</p>
              <span className="inline-block mt-3 bg-teal-100 text-[#0d9488] px-4 py-1.5 rounded-full text-xs font-black tracking-widest">{user.role}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {user.role === 'DRIVER' ? (
                <Link href="/driver/dashboard" className="btn-primary sm:col-span-2">Open Driver Dashboard</Link>
              ) : (
                <>
                  <Link href="/passenger/request" className="btn-primary">Request a Ride</Link>
                  <Link href="/passenger/history" className="btn-outline">View Trip History</Link>
                </>
              )}
              <button onClick={logout} className="btn-secondary sm:col-span-2 mt-4">Logout</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/login" className="btn-primary">Login</Link>
            <Link href="/signup" className="btn-secondary">Register</Link>
          </div>
        )}
      </div>
    </div>
  );
}