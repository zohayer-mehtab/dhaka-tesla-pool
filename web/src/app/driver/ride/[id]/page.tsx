'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { RideRequest, RideRequestStatus } from '@/types';
import { apiClient } from '@/lib/api-client';
import { RideStatusBadge } from '@/components/RideStatusBadge';
import { FareBreakdown } from '@/components/FareBreakdown';

export default function DriverRideDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [ride, setRide] = useState<RideRequest | null>(null);
  const [error, setError] = useState('');

  const fetchRide = useCallback(async () => {
    try {
      const res = await apiClient.get<RideRequest>(`/ride-requests/${id}`);
      setRide(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch ride');
    }
  }, [id]);

  useEffect(() => {
    fetchRide();
  }, [fetchRide]);

  async function updateStatus(status: RideRequestStatus) {
    try {
      await apiClient.patch(`/ride-requests/${id}/status`, { status });
      fetchRide();
    } catch (err: any) {
      setError(err.response?.data?.message || 'State Guard transition error');
    }
  }

  if (!ride) {
    return (
      <div className="border-[0.5px] border-black/30 p-8 bg-white font-mono text-xs uppercase">
        LOADING RIDE TELEMETRY...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="border-[0.5px] border-black/30 p-8 bg-white rounded-none space-y-6">
        <div className="flex justify-between items-start border-b-[0.5px] border-black/20 pb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tighter">RIDE MANIFEST DETAIL</h2>
            <p className="font-mono text-[10px] text-black/40">ID: {ride.id}</p>
          </div>
          <RideStatusBadge status={ride.status} />
        </div>

        {error && (
          <div className="border-[0.5px] border-red-600 bg-red-50 p-4 font-mono text-xs text-red-600 uppercase">
            ERROR: {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 font-mono text-xs border-b-[0.5px] border-black/20 pb-4">
          <div>
            <span className="text-black/40 text-[10px]">PICKUP</span>
            <p className="font-bold">{ride.pickupZone}</p>
          </div>
          <div>
            <span className="text-black/40 text-[10px]">DESTINATION</span>
            <p className="font-bold">{ride.destZone}</p>
          </div>
        </div>

        <FareBreakdown
          farePoysha={ride.fareAmountPoysha}
          seats={ride.seatsRequested}
          isPooled={Boolean(ride.poolId)}
        />

        <div className="flex gap-4 pt-4">
          {ride.status === RideRequestStatus.MATCHED && (
            <button
              onClick={() => updateStatus(RideRequestStatus.DRIVER_ARRIVED)}
              className="w-full py-4 bg-black text-white font-mono text-xs uppercase tracking-widest"
            >
              MARK DRIVER ARRIVED →
            </button>
          )}
          {ride.status === RideRequestStatus.DRIVER_ARRIVED && (
            <button
              onClick={() => updateStatus(RideRequestStatus.STARTED)}
              className="w-full py-4 bg-black text-white font-mono text-xs uppercase tracking-widest"
            >
              START TRIP →
            </button>
          )}
          {ride.status === RideRequestStatus.STARTED && (
            <button
              onClick={() => updateStatus(RideRequestStatus.COMPLETED)}
              className="w-full py-4 bg-black text-white font-mono text-xs uppercase tracking-widest"
            >
              COMPLETE TRIP →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}