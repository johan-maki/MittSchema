import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, X, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import type { HardBlockedSlot, MediumBlockedSlot } from "@/types/profile";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths } from "date-fns";
import { sv } from "date-fns/locale";

interface HardBlockedSlotsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockedSlots: HardBlockedSlot[] | MediumBlockedSlot[];
  onSave: (slots: HardBlockedSlot[] | MediumBlockedSlot[]) => void;
  variant?: 'hard' | 'medium'; // NEW: Controls color theme
}

const SHIFT_TYPES = [
  { id: 'day', label: 'Dagpass (06:00-14:00)', shortLabel: 'FM', color: 'bg-amber-500' },
  { id: 'evening', label: 'Kvällspass (14:00-22:00)', shortLabel: 'EM', color: 'bg-blue-500' },
  { id: 'night', label: 'Nattpass (22:00-06:00)', shortLabel: 'Natt', color: 'bg-indigo-600' },
  { id: 'all_day', label: 'Heldag', shortLabel: 'Heldag', color: 'bg-slate-700' },
] as const;

const MAX_BLOCKED_SLOTS = 3;

export const HardBlockedSlotsDialog = ({
  open,
  onOpenChange,
  blockedSlots,
  onSave,
  variant = 'hard', // Default to hard (red theme)
}: HardBlockedSlotsDialogProps) => {
  // Color themes based on variant
  const colors = variant === 'hard' ? {
    primary: 'red',
    icon: <Calendar className="h-6 w-6 text-red-600" />,
    title: 'Arbetstillfällen jag ej kan jobba',
    description: 'Markera specifika dagar och pass som du absolut inte kan arbeta. Detta är hårda krav som schemaläggningen måste respektera.',
    badgeBg: 'bg-red-600',
    borderColor: 'border-red-300',
    bgColor: 'bg-red-50',
    hoverBg: 'hover:bg-red-100',
    textColor: 'text-red-600',
    buttonBg: 'bg-red-600 hover:bg-red-700',
  } : {
    primary: 'amber',
    icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
    title: 'Arbetstillfällen jag helst avstår',
    description: 'Markera specifika dagar och pass som du helst vill undvika. Schemaläggningen försöker undvika dessa men kan schemalägga vid behov.',
    badgeBg: 'bg-amber-600',
    borderColor: 'border-amber-300',
    bgColor: 'bg-amber-50',
    hoverBg: 'hover:bg-amber-100',
    textColor: 'text-amber-600',
    buttonBg: 'bg-amber-600 hover:bg-amber-700',
  };
  
  const [selectedSlots, setSelectedSlots] = useState<typeof blockedSlots>(blockedSlots);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedShifts, setSelectedShifts] = useState<Set<string>>(new Set());

  // Get next month for scheduling
  const today = new Date();
  const nextMonth = addMonths(today, 1);
  const monthStart = startOfMonth(nextMonth);
  const monthEnd = endOfMonth(nextMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const remainingSlots = MAX_BLOCKED_SLOTS - selectedSlots.length;

  // Check if a date+shift combination is blocked
  const isSlotBlocked = (date: Date, shiftType: string) => {
    return selectedSlots.some(slot => {
      if (slot.date !== format(date, 'yyyy-MM-dd')) return false;
      return slot.shift_types.includes(shiftType as 'day' | 'evening' | 'night' | 'all_day') || slot.shift_types.includes('all_day');
    });
  };

  // Count total blocked shifts for a date
  const getBlockedShiftsCount = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const slot = selectedSlots.find(s => s.date === dateStr);
    if (!slot) return 0;
    if (slot.shift_types.includes('all_day')) return 3;
    return slot.shift_types.length;
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedShifts(new Set());
  };

  const handleShiftToggle = (shiftType: string) => {
    const newShifts = new Set(selectedShifts);
    if (newShifts.has(shiftType)) {
      newShifts.delete(shiftType);
    } else {
      // If selecting "all_day", clear other selections
      if (shiftType === 'all_day') {
        newShifts.clear();
        newShifts.add(shiftType);
      } else {
        // If other shifts selected, remove "all_day"
        newShifts.delete('all_day');
        newShifts.add(shiftType);
      }
    }
    setSelectedShifts(newShifts);
  };

  const handleConfirmBlock = () => {
    if (!selectedDate || selectedShifts.size === 0) return;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const shiftsArray = Array.from(selectedShifts) as ('day' | 'evening' | 'night' | 'all_day')[];

    // Remove existing blocks for this date
    const filteredSlots = selectedSlots.filter(slot => slot.date !== dateStr);

    // Add new block if we haven't reached the limit
    if (filteredSlots.length < MAX_BLOCKED_SLOTS) {
      const newSlot: HardBlockedSlot = {
        date: dateStr,
        shift_types: shiftsArray,
      };
      setSelectedSlots([...filteredSlots, newSlot]);
    }

    // Reset selection
    setSelectedDate(null);
    setSelectedShifts(new Set());
  };

  const handleRemoveSlot = (slot: HardBlockedSlot) => {
    setSelectedSlots(selectedSlots.filter(s => s.date !== slot.date));
  };

  const handleSave = () => {
    onSave(selectedSlots);
    onOpenChange(false);
  };

  const getWeekdayName = (date: Date) => {
    return format(date, 'EEE', { locale: sv });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            {colors.icon}
            {colors.title}
          </DialogTitle>
          <DialogDescription>
            {colors.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Bar */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-3 border-2 border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={`text-3xl font-bold ${remainingSlots === 0 ? 'text-red-600' : 'text-blue-600'}`}>
                    {remainingSlots}/{MAX_BLOCKED_SLOTS}
                  </div>
                  <div className="text-sm text-slate-600">
                    {remainingSlots === 0 ? 'Ta bort ett för att lägga till nytt' : 'Arbetstillfällen kvar att blockera'}
                  </div>
                </div>
              </div>
              {selectedSlots.length > 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium text-sm">{selectedSlots.length} blockerade</span>
                </div>
              )}
            </div>
          </div>

          {/* Selected Blocked Slots - Compact Version */}
          {selectedSlots.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-700 text-sm">Dina blockerade arbetstillfällen:</h3>
              <div className="grid gap-1.5">
                {selectedSlots.map((slot, idx) => {
                  const slotDate = new Date(slot.date + 'T12:00:00');
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-center min-w-[50px]">
                          <div className="text-lg font-bold text-red-600">
                            {format(slotDate, 'd', { locale: sv })}
                          </div>
                          <div className="text-[10px] text-red-600 uppercase font-medium">
                            {format(slotDate, 'MMM', { locale: sv })}
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">
                            {format(slotDate, 'EEE d MMM', { locale: sv })}
                          </div>
                          <div className="flex gap-1 mt-0.5">
                            {slot.shift_types.map(type => {
                              const shiftInfo = SHIFT_TYPES.find(s => s.id === type);
                              return (
                                <Badge key={type} className={`${shiftInfo?.color} text-white text-[10px] px-1.5 py-0`}>
                                  {shiftInfo?.shortLabel}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSlot(slot)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Compact Calendar */}
          <div>
            <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              {format(nextMonth, 'MMMM yyyy', { locale: sv })}
            </h3>

            {/* Weekday headers - compact */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-slate-600 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days - much more compact */}
            <div className="grid grid-cols-7 gap-1">
              {/* Padding for first week */}
              {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
                <div key={`padding-${i}`} />
              ))}
              
              {/* Days - smaller boxes */}
              {daysInMonth.map(date => {
                const blockedCount = getBlockedShiftsCount(date);
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const hasBlocks = blockedCount > 0;
                const isPast = date < today;

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => !isPast && remainingSlots > 0 && handleDateClick(date)}
                    disabled={isPast || (remainingSlots === 0 && !hasBlocks)}
                    className={`
                      relative h-10 p-1 rounded-md border transition-all
                      ${isPast ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
                        isSelected ? 'border-blue-500 bg-blue-50 shadow-md border-2' :
                        hasBlocks ? 'border-red-300 bg-red-50 hover:bg-red-100' :
                        remainingSlots > 0 ? 'border-slate-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer' :
                        'border-slate-200 bg-slate-50 cursor-not-allowed'}
                    `}
                  >
                    <div className="text-center">
                      <div className={`text-sm font-semibold ${isSelected ? 'text-blue-700' : hasBlocks ? 'text-red-600' : 'text-slate-800'}`}>
                        {format(date, 'd')}
                      </div>
                      {hasBlocks && (
                        <div className="flex justify-center gap-0.5 mt-0.5">
                          {Array.from({ length: blockedCount }).map((_, i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-red-500" />
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shift Selection - Compact */}
          {selectedDate && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-blue-900 text-sm">
                  Välj pass för {format(selectedDate, 'd MMMM', { locale: sv })}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedDate(null);
                    setSelectedShifts(new Set());
                  }}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {SHIFT_TYPES.map(shift => (
                  <button
                    key={shift.id}
                    onClick={() => handleShiftToggle(shift.id)}
                    className={`
                      p-2 rounded-lg border-2 transition-all text-left
                      ${selectedShifts.has(shift.id)
                        ? `${shift.color} text-white border-transparent shadow-md`
                        : 'bg-white border-slate-200 hover:border-blue-300 text-slate-700'}
                    `}
                  >
                    <div className="font-semibold text-sm">{shift.shortLabel}</div>
                    <div className="text-[10px] opacity-90">{shift.label.split('(')[1]?.replace(')', '')}</div>
                  </button>
                ))}
              </div>

              <Button
                onClick={handleConfirmBlock}
                disabled={selectedShifts.size === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8 text-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Bekräfta blockering
              </Button>
            </div>
          )}

          {/* Action buttons - compact */}
          <div className="flex justify-between pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-sm"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white h-9 text-sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Spara blockeringar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
