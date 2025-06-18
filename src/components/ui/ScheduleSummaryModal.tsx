import React from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Clock, Calendar, TrendingUp, Award, BarChart3 } from 'lucide-react';
import type { Shift } from '@/types/shift';
import type { Profile } from '@/types/profile';
import { format, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';

interface EmployeeSummary {
  id: string;
  name: string;
  role: string;
  totalShifts: number;
  totalHours: number;
  morningShifts: number;
  afternoonShifts: number;
  nightShifts: number;
  weekendShifts: number;
  experienceLevel: number;
}

interface ScheduleSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: Shift[];
  employees: Profile[];
  startDate: Date;
  endDate: Date;
}

export const ScheduleSummaryModal: React.FC<ScheduleSummaryModalProps> = ({
  isOpen,
  onClose,
  shifts,
  employees,
  startDate,
  endDate
}) => {
  if (!isOpen) return null;

  // Calculate employee summaries
  const employeeSummaries = employees.map(employee => {
    const employeeShifts = shifts.filter(shift => shift.employee_id === employee.id);
    
    let totalHours = 0;
    let morningShifts = 0;
    let afternoonShifts = 0;
    let nightShifts = 0;
    let weekendShifts = 0;

    employeeShifts.forEach(shift => {
      const start = parseISO(shift.start_time);
      const end = parseISO(shift.end_time);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      totalHours += hours;

      // Determine shift type based on start time
      const startHour = start.getHours();
      if (startHour >= 6 && startHour < 14) {
        morningShifts++;
      } else if (startHour >= 14 && startHour < 22) {
        afternoonShifts++;
      } else {
        nightShifts++;
      }

      // Check if weekend
      const dayOfWeek = start.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendShifts++;
      }
    });

    return {
      id: employee.id,
      name: `${employee.first_name} ${employee.last_name}`,
      role: employee.role,
      totalShifts: employeeShifts.length,
      totalHours: Math.round(totalHours * 10) / 10,
      morningShifts,
      afternoonShifts,
      nightShifts,
      weekendShifts,
      experienceLevel: employee.experience_level
    };
  }).sort((a, b) => b.totalShifts - a.totalShifts); // Sort by total shifts descending

  // Calculate overall statistics
  const totalGeneratedShifts = shifts.length;
  const totalCoveredHours = employeeSummaries.reduce((sum, emp) => sum + emp.totalHours, 0);
  const averageShiftsPerEmployee = totalGeneratedShifts / employees.length;
  const averageHoursPerEmployee = totalCoveredHours / employees.length;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        style={{ zIndex: 9998 }}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col" style={{ zIndex: 10000 }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Schema Sammanfattning</h2>
                <p className="text-green-100 text-sm">
                  {format(startDate, 'd MMMM', { locale: sv })} - {format(endDate, 'd MMMM yyyy', { locale: sv })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Overall Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Totalt Pass</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-1">{totalGeneratedShifts}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Totalt Timmar</span>
              </div>
              <p className="text-2xl font-bold text-green-900 mt-1">{Math.round(totalCoveredHours)}</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Snitt Pass/Person</span>
              </div>
              <p className="text-2xl font-bold text-purple-900 mt-1">{Math.round(averageShiftsPerEmployee * 10) / 10}</p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Snitt Timmar/Person</span>
              </div>
              <p className="text-2xl font-bold text-orange-900 mt-1">{Math.round(averageHoursPerEmployee * 10) / 10}</p>
            </div>
          </div>

          {/* Employee Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Award className="h-5 w-5 text-gray-600" />
              <span>Detaljerad Fördelning per Medarbetare</span>
            </h3>
            
            <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medarbetare
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Totalt Pass
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Totalt Timmar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Passfördelning
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Helgpass
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Erfarenhet
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employeeSummaries.map((summary, index) => (
                    <tr key={summary.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{summary.name}</div>
                          <div className="text-sm text-gray-500">{summary.role}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {summary.totalShifts} pass
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold">{summary.totalHours}h</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          {summary.morningShifts > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              🌅 {summary.morningShifts}
                            </span>
                          )}
                          {summary.afternoonShifts > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                              ☀️ {summary.afternoonShifts}
                            </span>
                          )}
                          {summary.nightShifts > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                              🌙 {summary.nightShifts}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {summary.weekendShifts > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {summary.weekendShifts} helgpass
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Inga helgpass</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-2 bg-gray-200 rounded-full mr-2">
                            <div
                              className="h-2 bg-green-500 rounded-full"
                              style={{ width: `${(summary.experienceLevel / 10) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{summary.experienceLevel}/10</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Schema genererat {format(new Date(), 'HH:mm, d MMMM yyyy', { locale: sv })}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all shadow-lg"
            >
              Stäng
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
