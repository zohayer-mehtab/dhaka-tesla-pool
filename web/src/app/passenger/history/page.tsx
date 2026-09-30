'use client';

import React, { useEffect, useState } from 'react';
import { RideRequest } from '@/types';
import { apiClient } from '@/lib/api-client';
import { RideStatusBadge } from '@/components/RideStatusBadge';

export default function PassengerHistoryPage() {
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await apiClient.get<RideRequest[]>('/ride-requests');
        setRides(res.data);
      } catch {
        // Handle error gracefully
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="border-[0.5px] border-black/30 p-8 bg-white rounded-none space-y-6">
        <div className="border-b-[0.5px] border-black/20 pb-4">
          <h2 className="text-2xl font-bold tracking-tighter">DISPATCH HISTORY</h2>
          <p className="font-mono text-xs text-black/50 uppercase mt-1">
            IMMUTABLE POYSHA AUDIT TRAIL
          </p>
        </div>

        {loading ? (
          <p className="font-mono text-xs text-black/40">QUERYING LEDGER...</p>
        ) : rides.length === 0 ? (
          <p className="font-mono text-xs text-black/40">NO HISTORICAL DISPATCH RECORDS</p>
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => (
              <div
                key={ride.id}
                className="border-[0.5px] border-black/20 p-4 bg-[#F9F9F9] flex flex-wrap justify-between items-center gap-4"
              >
                <div className="space-y-1">
                  <span className="font-mono text-xs font-bold">
                    {ride.pickupZone} → {ride.destZone}
                  </span>
                  <p className="font-mono text-[10px] text-black/40">
                    SEATS: {ride.seatsRequested} // POYSHA: {ride.fareAmountPoysha}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm font-bold">
                    ৳{(ride.fareAmountPoysha / 100).toFixed(2)}
                  </span>
                  <RideStatusBadge status={ride.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}