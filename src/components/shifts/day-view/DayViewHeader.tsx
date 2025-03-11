
import React from 'react';

const HOURS = Array.from({ length: 23 }, (_, i) => i + 1);

export const DayViewHeader = () => {
  return (
    <div className="grid grid-cols-[200px,1fr] bg-white sticky top-0 z-10">
      <div className="border-b border-r border-gray-200 p-3 font-medium text-gray-500 text-sm">
        Roll
      </div>
      <div className="grid grid-cols-[repeat(23,1fr)] border-b border-gray-200">
        {HOURS.map((hour) => (
          <div key={hour} className="text-center text-xs text-gray-500 py-3 border-r border-gray-200">
            {hour % 12 || 12}{hour >= 12 ? 'PM' : 'AM'}
          </div>
        ))}
      </div>
    </div>
  );
};
