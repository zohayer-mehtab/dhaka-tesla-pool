'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DhakaZone, RideRequest, RideRequestStatus } from '@/types';
import { apiClient } from '@/lib/api-client';
import { FareBreakdown } from '@/components/FareBreakdown';

const ZONES = Object.values(DhakaZone);

export default function RequestRidePage() {
  const router = useRouter();
  const [pickupZone, setPickupZone] = useState<DhakaZone>(DhakaZone.BANANI);
  const [destZone, setDestZone] = useState<DhakaZone>(DhakaZone.MOHAKHALI);
  const [seats, setSeats] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const estimatedPoysha = pickupZone === destZone ? 0 : 3000 * seats + 5000 * seats;

  useEffect(() => {
    // Prevent double booking by checking if passenger already has an active ride
    async function checkActiveRide() {
      try {
        const res = await apiClient.get<RideRequest[]>('/ride-requests');
        const activeRide = res.data.find(r => 
          [RideRequestStatus.REQUESTED, RideRequestStatus.MATCHED, RideRequestStatus.DRIVER_ARRIVED, RideRequestStatus.STARTED].includes(r.status)
        );
        if (activeRide) {
          router.replace(`/passenger/status/${activeRide.id}`);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setLoading(false);
      }
    }
    checkActiveRide();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pickupZone === destZone) return setError('Pickup and Destination zones must differ');
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post<RideRequest>('/ride-requests', { pickupZone, destZone, seats });
      router.push(`/passenger/status/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ride request failed. Ensure you are logged in.');
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8 text-center font-bold text-gray-500 mt-20">Checking active dispatch...</div>;

  return (
    <div className="p-6 space-y-6 pt-12">
      <div className="mb-8">
        <h2 className="text-4xl font-black tracking-tight text-[#111827]">Where to?</h2>
        <p className="text-gray-500 font-medium mt-2">Initiate dispatch matching.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <select value={pickupZone} onChange={(e) => setPickupZone(e.target.value as DhakaZone)} className="input-field font-bold">
            {ZONES.map((z) => <option key={z} value={z}>{z} (Pickup)</option>)}
          </select>
          <select value={destZone} onChange={(e) => setDestZone(e.target.value as DhakaZone)} className="input-field font-bold">
            {ZONES.map((z) => <option key={z} value={z}>{z} (Drop-off)</option>)}
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-700 px-1">How many seats?</label>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((num) => (
              <button
                type="button"
                key={num}
                onClick={() => setSeats(num)}
                className={`py-4 rounded-2xl font-bold transition-all ${seats === num ? 'bg-[#0d9488] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <FareBreakdown farePoysha={estimatedPoysha} seats={seats} />

        <div className="pt-4">
          <button type="submit" disabled={loading || pickupZone === destZone} className="btn-primary">
            Confirm Request
          </button>
        </div>
      </form>
    </div>
  );
}