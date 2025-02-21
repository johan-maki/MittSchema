
import React from 'react';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const TimeHeader = () => {
  return (
    <div className="grid grid-cols-[200px,1fr] bg-gray-50 border-b">
      <div className="p-4 font-medium text-gray-500">Role</div>
      <div className="grid grid-cols-24 border-l">
        {HOURS.map((hour) => (
          <div 
            key={hour} 
            className="text-center text-sm text-gray-500 p-4 border-r"
          >
            {hour}:00
          </div>
        ))}
      </div>
    </div>
  );
};
