import React from 'react';

export const FareBreakdown = ({ farePoysha, seats, isPooled = false }: { farePoysha: number, seats: number, isPooled?: boolean }) => {
  return (
    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <span className="text-sm font-semibold text-gray-500">Seat Allocation</span>
        <span className="font-bold">{seats} SEAT(S)</span>
      </div>
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <span className="text-sm font-semibold text-gray-500">Rate Standard</span>
        <span className="text-sm font-bold text-[#0d9488]">{isPooled ? '20% POOL DISCOUNT' : 'SINGLE TARIFF'}</span>
      </div>
      <div className="flex justify-between items-end pt-2">
        <span className="text-sm font-semibold text-gray-500">Total Fare</span>
        <span className="text-4xl font-black text-[#111827]">{(farePoysha / 100).toFixed(2)} ৳</span>
      </div>
    </div>
  );
};