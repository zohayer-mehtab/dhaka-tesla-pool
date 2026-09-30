'use client';

import React, { useEffect, useState } from 'react';
import { RideRequest, RideRequestStatus } from '@/types';
import { apiClient } from '@/lib/api-client';

export default function DriverHistoryPage() {
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await apiClient.get<RideRequest[]>('/ride-requests');
        // Filter for completed/cancelled rides to represent history
        const historical = res.data.filter(r => 
          r.status === RideRequestStatus.COMPLETED || r.status === RideRequestStatus.CANCELLED
        );
        setRides(historical);
      } catch {
        // Handle error gracefully
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-6 border-b pb-4">Trip Ledger</h2>
        
        {loading ? (
          <p className="text-gray-400 font-semibold">Loading ledger...</p>
        ) : rides.length === 0 ? (
          <p className="text-gray-400 font-semibold">No historical trips found.</p>
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => (
              <div key={ride.id} className="bg-gray-50 p-5 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="font-bold text-lg">{ride.pickupZone} → {ride.destZone}</p>
                  <p className="text-sm text-gray-500 font-medium mt-1">Seats: {ride.seatsRequested}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#0d9488] text-lg">{(ride.fareAmountPoysha / 100).toFixed(2)} ৳</p>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${ride.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {ride.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}