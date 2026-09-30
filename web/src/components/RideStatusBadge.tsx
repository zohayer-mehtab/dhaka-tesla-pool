import React from 'react';
import { RideRequestStatus } from '@/types';

export const RideStatusBadge = ({ status }: { status: RideRequestStatus }) => {
  const styles = {
    REQUESTED: 'bg-gray-200 text-gray-700',
    MATCHED: 'bg-teal-100 text-[#0d9488]',
    DRIVER_ARRIVED: 'bg-blue-100 text-blue-700',
    STARTED: 'bg-purple-100 text-purple-700 animate-pulse',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${styles[status] || styles.REQUESTED}`}>
      {status.replace('_', ' ')}
    </span>
  );
};