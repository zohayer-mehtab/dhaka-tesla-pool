'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RideRequest, RideRequestStatus } from '@/types';
import { apiClient } from '@/lib/api-client';
import { RideStatusBadge } from '@/components/RideStatusBadge';
import { FareBreakdown } from '@/components/FareBreakdown';

export default function RideStatusPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [ride, setRide] = useState<RideRequest | null>(null);
  const [error, setError] = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiClient.get<RideRequest>(`/ride-requests/${id}`);
      setRide(res.data);
    } catch (err: any) {
      setError('Failed to fetch status');
    }
  }, [id]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  async function handleCancel() {
    if (!ride) return;
    try {
      await apiClient.patch(`/ride-requests/${id}/status`, { status: RideRequestStatus.CANCELLED });
      fetchStatus();
    } catch (err: any) {
      setError('Failed to cancel ride');
    }
  }

  if (!ride) return <div className="p-8 text-center font-bold">Connecting to Tracker...</div>;

  const canCancel = [RideRequestStatus.REQUESTED, RideRequestStatus.MATCHED, RideRequestStatus.DRIVER_ARRIVED].includes(ride.status);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-[#111827]">Tracker</h2>
          <p className="text-gray-400 text-xs font-mono mt-1">ID: {ride.id.split('-')[0]}</p>
        </div>
        <RideStatusBadge status={ride.status} />
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold">{error}</div>}

      <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pickup</span>
          <p className="font-black text-lg">{ride.pickupZone}</p>
        </div>
        <div className="text-gray-300">→</div>
        <div className="text-right">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Drop</span>
          <p className="font-black text-lg">{ride.destZone}</p>
        </div>
      </div>

      <FareBreakdown farePoysha={ride.fareAmountPoysha} seats={ride.seatsRequested} isPooled={Boolean(ride.poolId)} />

      <div className="space-y-3 pt-6">
        {canCancel && (
          <button onClick={handleCancel} className="w-full py-4 rounded-full font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
            Cancel Trip
          </button>
        )}
        <button onClick={() => router.push('/')} className="btn-outline border-gray-200">
          Return Home
        </button>
      </div>
    </div>
  );
}