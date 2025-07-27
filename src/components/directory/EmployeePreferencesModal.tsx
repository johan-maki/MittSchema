import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Profile } from '@/types/profile';
import { X, Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

interface EmployeePreferencesModalProps {
  employee: Profile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeePreferencesModal = ({ employee, isOpen, onClose }: EmployeePreferencesModalProps) => {
  if (!employee) return null;

  const { work_preferences } = employee;

  const shiftLabels = {
    day: 'Dagpass',
    evening: 'Kvällspass', 
    night: 'Nattpass'
  };

  const weekdayLabels = {
    monday: 'Måndag',
    tuesday: 'Tisdag',
    wednesday: 'Onsdag',
    thursday: 'Torsdag',
    friday: 'Fredag',
    saturday: 'Lördag',
    sunday: 'Söndag'
  };

  const getInitials = (first_name: string, last_name: string) => {
    return `${first_name[0]}${last_name[0]}`.toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500',
      'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="relative">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg -mx-6 -mt-6 mb-6 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${getAvatarColor(employee.first_name + employee.last_name)}`}>
                {getInitials(employee.first_name, employee.last_name)}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white mb-1">
                  {employee.first_name} {employee.last_name}
                </DialogTitle>
                <p className="text-blue-100 text-lg">{employee.role} • {employee.department}</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Max Days per Week */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Clock className="w-5 h-5 text-blue-600 mr-2" />
              Maximal arbetsbelastning
            </h3>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Max dagar per vecka:</span>
                <Badge variant="outline" className="text-lg px-3 py-1 bg-blue-100 text-blue-800 border-blue-300">
                  {work_preferences.max_shifts_per_week} dagar
                </Badge>
              </div>
            </div>
          </div>

          {/* Available Days */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 text-green-600 mr-2" />
              Tillgängliga veckodagar
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(weekdayLabels).map(([day, label]) => {
                const constraint = work_preferences.day_constraints[day as keyof typeof work_preferences.day_constraints];
                const isAvailable = constraint?.available;
                const isStrict = constraint?.strict;
                
                return (
                  <div 
                    key={day}
                    className={`
                      p-3 rounded-lg border-2 transition-all duration-200 text-center
                      ${isAvailable 
                        ? 'bg-green-100 border-green-300 text-green-800' 
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <span className="font-medium text-sm">{label}</span>
                      {isAvailable && (
                        <div className="flex items-center space-x-1">
                          {isStrict ? (
                            <div className="flex items-center space-x-1">
                              <AlertCircle className="w-4 h-4 text-green-700" />
                              <span className="text-xs font-bold text-green-700">MÅSTE</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="text-xs text-green-600">Kan</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preferred Shifts */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 text-orange-600 mr-2" />
              Passtyper
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(shiftLabels).map(([shift, label]) => {
                const constraint = work_preferences.shift_constraints[shift as keyof typeof work_preferences.shift_constraints];
                const isPreferred = constraint?.preferred;
                const isStrict = constraint?.strict;
                
                return (
                  <div 
                    key={shift}
                    className={`
                      p-4 rounded-lg border-2 transition-all duration-200
                      ${isPreferred 
                        ? 'bg-orange-100 border-orange-300 text-orange-800' 
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                      }
                    `}
                  >
                    <div className="text-center space-y-2">
                      <div className="font-semibold">{label}</div>
                      <div className="text-sm">
                        {shift === 'day' && '08:00 - 16:00'}
                        {shift === 'evening' && '16:00 - 00:00'}
                        {shift === 'night' && '00:00 - 08:00'}
                      </div>
                      {isPreferred && (
                        <div className="flex items-center justify-center space-x-1">
                          {isStrict ? (
                            <div className="flex items-center space-x-1">
                              <AlertCircle className="w-4 h-4 text-orange-700" />
                              <span className="text-xs font-bold text-orange-700">MÅSTE</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <CheckCircle2 className="w-4 h-4 text-orange-600" />
                              <span className="text-xs text-orange-600">Föredrar</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Förklaring:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-gray-600">Kan/Föredrar - Mjuk preferens</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="text-gray-600">Måste - Hård begränsning</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
