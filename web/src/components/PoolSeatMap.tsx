import React from 'react';

interface Props {
  capacity: number;
  taken: number;
  vehicleLabel?: string;
}

export const PoolSeatMap: React.FC<Props> = ({ capacity, taken, vehicleLabel = 'BULLET' }) => {
  const seats = Array.from({ length: capacity }, (_, i) => i < taken);

  return (
    <div className="border-[0.5px] border-black/30 p-6 bg-[#F9F9F9] rounded-none space-y-4">
      <div className="flex justify-between items-center border-b-[0.5px] border-black/20 pb-2">
        <span className="font-mono text-xs tracking-widest uppercase text-black">
          VEHICLE MANIFEST // {vehicleLabel}
        </span>
        <span className="font-mono text-xs text-black/60">
          {taken}/{capacity} OCCUPIED
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-2">
        {seats.map((isOccupied, idx) => (
          <div
            key={idx}
            className={`h-16 border-[0.5px] border-black/40 p-2 flex flex-col justify-between rounded-none transition-all ${
              isOccupied ? 'bg-black text-white' : 'bg-white text-black/30'
            }`}
          >
            <span className="font-mono text-[10px] tracking-widest">S-0{idx + 1}</span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider">
              {isOccupied ? 'FILLED' : 'EMPTY'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};