
import { Shift } from "@/types/shift";
import { format } from "date-fns";
import React from "react";

interface ShiftItemProps {
  shift: Shift;
  startPercent: number;
  widthPercent: number;
  maxWidth: number;
  position: number;
  bgColor: string;
  borderColor: string;
  onClick: (shift: Shift) => void;
}

export const ShiftItem = ({
  shift,
  startPercent,
  widthPercent,
  maxWidth,
  position,
  bgColor,
  borderColor,
  onClick,
}: ShiftItemProps) => {
  const start = new Date(shift.start_time);
  const end = new Date(shift.end_time);

  return (
    <div
      className="absolute top-0 h-24 rounded-lg border text-sm transition-all cursor-pointer hover:brightness-95"
      style={{
        left: `${startPercent}%`,
        width: `${widthPercent}%`,
        backgroundColor: bgColor,
        borderColor: borderColor,
        maxWidth: `${maxWidth}%`,
        transform: `translateY(${position * 33}%)`,
      }}
      onClick={() => onClick(shift)}
    >
      <div className="p-2">
        <div className="font-medium">
          {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
        </div>
        {shift.profiles && (
          <div className="text-gray-600 truncate">
            {shift.profiles.first_name} {shift.profiles.last_name}
          </div>
        )}
        {shift.notes && (
          <div className="text-gray-500 text-xs truncate">{shift.notes}</div>
        )}
      </div>
    </div>
  );
};
