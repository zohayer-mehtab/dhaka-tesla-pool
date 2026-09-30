'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { RideRequest, RideRequestStatus, Pool } from '@/types';
import { apiClient } from '@/lib/api-client';
import { RideStatusBadge } from '@/components/RideStatusBadge';

export default function DriverDashboardPage() {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [activePool, setActivePool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await apiClient.get<RideRequest[]>('/ride-requests');
      setRequests(res.data);
    } catch (err: any) {
      setError('Failed to sync data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Rehydrate state from memory to survive refreshes
    const savedOnline = localStorage.getItem('hitch_driver_online') === 'true';
    const savedPool = localStorage.getItem('hitch_active_pool');
    if (savedOnline) setIsOnline(true);
    if (savedPool) setActivePool(JSON.parse(savedPool));
    
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 3000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  async function toggleOnline() {
    try {
      const newStatus = !isOnline;
      await apiClient.patch('/vehicles/me/status', { isOnline: newStatus });
      setIsOnline(newStatus);
      localStorage.setItem('hitch_driver_online', String(newStatus));
      
      if (!newStatus) {
        localStorage.removeItem('hitch_active_pool');
        setActivePool(null);
      }
    } catch (err: any) {
      setError('Failed to update vehicle status');
    }
  }

  async function createPool() {
    try {
      const res = await apiClient.post<Pool>('/pools');
      setActivePool(res.data);
      localStorage.setItem('hitch_active_pool', JSON.stringify(res.data));
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create pool');
    }
  }

  async function handleMatch(rideRequestId: string) {
    if (!activePool) return;
    try {
      await apiClient.post(`/pools/${activePool.id}/match/${rideRequestId}`);
      fetchDashboardData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Capacity Lock Rejected');
    }
  }

  async function updateRideStatus(id: string, status: RideRequestStatus) {
    try {
      await apiClient.patch(`/ride-requests/${id}/status`, { status });
      fetchDashboardData();
    } catch (err: any) {
      setError('State Transition Failed');
    }
  }

  if (loading) return <div className="p-8 text-center font-bold">Initializing System...</div>;

  const incomingRequests = requests.filter((r) => r.status === RideRequestStatus.REQUESTED);
  const activePoolRides = requests.filter((r) =>
    [RideRequestStatus.MATCHED, RideRequestStatus.DRIVER_ARRIVED, RideRequestStatus.STARTED].includes(r.status)
  );

  // Calculate physically occupied seats
  const currentSeatsTaken = activePoolRides.reduce((sum, req) => sum + req.seatsRequested, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Terminal</h2>
            <p className="text-gray-500 text-sm font-medium">Vehicle: Bullet (3 Seats)</p>
          </div>
          <button 
            onClick={toggleOnline} 
            className={`px-5 py-2 rounded-full font-bold text-xs tracking-wider transition-colors ${isOnline ? 'bg-[#0d9488] text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm font-semibold">{error}</div>}

        {isOnline && !activePool && (
          <button onClick={createPool} className="btn-primary">Start New Pool Session</button>
        )}
      </div>

      {isOnline && activePool && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-lg border-b border-gray-100 pb-2">Nearby Requests</h3>
            {incomingRequests.length === 0 ? (
              <p className="text-gray-400 text-sm">No pending requests</p>
            ) : (
              incomingRequests.map((req) => {
                const canAccept = activePool && ((currentSeatsTaken + req.seatsRequested) <= activePool.seatsCapacity);

                return (
                  <div key={req.id} className="bg-gray-50 p-4 rounded-2xl">
                    <div className="flex justify-between font-semibold mb-3 text-sm">
                      <span>{req.pickupZone} → {req.destZone}</span>
                      <span className="text-[#0d9488]">{req.seatsRequested} Seat(s)</span>
                    </div>
                    {canAccept ? (
                      <button onClick={() => handleMatch(req.id)} className="btn-primary py-3 text-sm">Accept Passenger</button>
                    ) : (
                      <div className="text-xs font-bold text-red-500 text-center py-2 bg-red-50 rounded-xl">EXCEEDS CAPACITY</div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-lg border-b border-gray-100 pb-2">Active Manifest</h3>
            {activePoolRides.length === 0 ? (
              <p className="text-gray-400 text-sm">Pool is currently empty</p>
            ) : (
              activePoolRides.map((req) => (
                <div key={req.id} className="bg-gray-50 p-4 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-sm">{req.pickupZone} → {req.destZone}</p>
                    <RideStatusBadge status={req.status} />
                  </div>
                  <div className="flex gap-2">
                    {req.status === RideRequestStatus.MATCHED && (
                      <button onClick={() => updateRideStatus(req.id, RideRequestStatus.DRIVER_ARRIVED)} className="btn-secondary py-2 text-xs">Mark Arrived</button>
                    )}
                    {req.status === RideRequestStatus.DRIVER_ARRIVED && (
                      <button onClick={() => updateRideStatus(req.id, RideRequestStatus.STARTED)} className="btn-primary py-2 text-xs">Start Trip</button>
                    )}
                    {req.status === RideRequestStatus.STARTED && (
                      <button onClick={() => updateRideStatus(req.id, RideRequestStatus.COMPLETED)} className="btn-outline py-2 text-xs">Complete</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}