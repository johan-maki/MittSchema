
import { Card } from "@/components/ui/card";
import { Shift } from "@/types/shift";
import { format } from "date-fns";

interface ShiftListProps {
  shifts: Shift[];
}

export const ShiftList = ({ shifts }: ShiftListProps) => (
  <div className="space-y-2 mt-4">
    {shifts.map((shift) => (
      <Card key={shift.id} className="p-4 bg-white/90 backdrop-blur-sm hover:shadow-md transition-all">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-secondary">
              {format(new Date(shift.start_time), 'HH:mm')} - 
              {format(new Date(shift.end_time), 'HH:mm')}
            </h3>
            <p className="text-sm text-gray-600">{shift.department}</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs capitalize" 
            style={{
              backgroundColor: 
                shift.shift_type === 'day' ? '#E5F6FD' :
                shift.shift_type === 'evening' ? '#FFF4E5' : '#FCE7F3',
              color:
                shift.shift_type === 'day' ? '#0EA5E9' :
                shift.shift_type === 'evening' ? '#F59E0B' : '#EC4899'
            }}>
            {shift.shift_type === 'day' ? 'Dag' :
             shift.shift_type === 'evening' ? 'Kväll' : 'Natt'}
          </span>
        </div>
        {shift.notes && (
          <p className="text-sm text-gray-500 mt-2">{shift.notes}</p>
        )}
      </Card>
    ))}
  </div>
);
