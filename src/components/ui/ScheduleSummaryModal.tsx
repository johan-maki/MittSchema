import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Clock, Calendar, TrendingUp, Award, BarChart3, AlertTriangle, Info, DollarSign, CheckCircle, RefreshCw, XCircle, HelpCircle } from 'lucide-react';
import type { Shift } from '@/types/shift';
import type { Profile } from '@/types/profile';
import type { StaffingIssue } from '@/components/shifts/utils/staffingUtils';
import { format, parseISO, getDaysInMonth } from 'date-fns';
import { sv } from 'date-fns/locale';
import { EmployeePreferencesModal } from '@/components/directory/EmployeePreferencesModal';
import { PartialCoverageWarning } from '@/components/shifts/PartialCoverageWarning';
import { OptimizationScoreComparison } from '@/components/schedule/OptimizationScoreComparison';

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
  workloadPercentage: number; // Actual workload achieved
  targetWorkPercentage: number; // Target workload set by employee
}

interface ScheduleSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  onRegenerate?: () => void;
  onCancel?: () => void;
  shifts: Shift[];
  employees: Profile[];
  startDate: Date;
  endDate: Date;
  staffingIssues?: StaffingIssue[];
  coverageStats?: {
    total_shifts: number;
    filled_shifts: number;
    coverage_percentage: number;
    uncovered_count?: number;
    uncovered_shifts?: Array<{
      date: string;
      day_name: string;
      shift_type: string;
      shift_label: string;
      reasons: string[];
    }>;
    shift_type_coverage?: {
      day: { filled: number; total: number; percentage: number };
      evening: { filled: number; total: number; percentage: number };
      night: { filled: number; total: number; percentage: number };
    };
  };
  previousOptimizationScore?: number;
  currentOptimizationScore?: number;
}

export const ScheduleSummaryModal: React.FC<ScheduleSummaryModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  onRegenerate, 
  onCancel,
  shifts,
  employees,
  startDate,
  endDate,
  staffingIssues = [],
  coverageStats,
  previousOptimizationScore,
  currentOptimizationScore
}) => {
  const [showCoverageDetails, setShowCoverageDetails] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Profile | null>(null);
  const [showEmployeePreferences, setShowEmployeePreferences] = useState(false);
  
  const handleEmployeeClick = (employeeId: string) => {
    console.log('🖱️ Employee clicked:', employeeId);
    const employee = employees.find(emp => emp.id === employeeId);
    if (employee) {
      console.log('✅ Employee found, opening preferences modal:', employee.first_name, employee.last_name);
      setSelectedEmployee(employee);
      setShowEmployeePreferences(true);
    } else {
      console.error('❌ Employee not found with ID:', employeeId);
    }
  };
  
  if (!isOpen) return null;

  // Calculate days in month for workload calculation
  const daysInMonth = getDaysInMonth(startDate);
  const fullTimeHoursPerMonth = daysInMonth * 8 * (5/7); // Assuming 5 working days per week

  // Calculate employee summaries
  const employeeSummaries = employees.map(employee => {
    // Filter shifts to only include those within the target month for this employee
    const employeeShifts = shifts.filter(shift => {
      const shiftDate = parseISO(shift.start_time);
      return shift.employee_id === employee.id && 
             shiftDate >= startDate && 
             shiftDate <= endDate;
    });
    
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

    // Calculate workload percentage based on full-time equivalent
    const workloadPercentage = Math.round((totalHours / fullTimeHoursPerMonth) * 100);
    const targetWorkPercentage = employee.work_percentage || 100; // Default to 100% if not set

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
      experienceLevel: employee.experience_level,
      workloadPercentage,
      targetWorkPercentage
    };
  }).sort((a, b) => b.totalShifts - a.totalShifts);

  // Calculate coverage statistics
  // Filter shifts to only include those within the target month
  const shiftsInTargetMonth = shifts.filter(shift => {
    const shiftDate = parseISO(shift.start_time);
    return shiftDate >= startDate && shiftDate <= endDate;
  });
  
  const totalRequiredShifts = daysInMonth * 3; // Assuming 3 shifts per day (morning, afternoon, night)
  const totalAssignedShifts = shiftsInTargetMonth.length; // Total number of shift assignments
  
  // Count unique shift slots (not number of employees assigned)
  // Group by date and shift type to get unique pass slots
  const uniqueShiftSlots = new Set();
  shiftsInTargetMonth.forEach(shift => {
    const shiftDate = parseISO(shift.start_time);
    const dateStr = format(shiftDate, 'yyyy-MM-dd');
    const hour = shiftDate.getHours();
    
    // Determine shift type based on hour
    let shiftType;
    if (hour >= 6 && hour < 14) {
      shiftType = 'morning';
    } else if (hour >= 14 && hour < 22) {
      shiftType = 'afternoon';
    } else {
      shiftType = 'night';
    }
    
    uniqueShiftSlots.add(`${dateStr}-${shiftType}`);
  });
  
  const totalCoveredShifts = uniqueShiftSlots.size;
  const coveragePercentage = Math.round((totalCoveredShifts / totalRequiredShifts) * 100);
  
  // Calculate total cost (assuming average hourly rate from employees)
  const averageHourlyRate = employees.reduce((sum, emp) => sum + (emp.hourly_rate || 1000), 0) / employees.length;
  const totalCoveredHours = employeeSummaries.reduce((sum, emp) => sum + emp.totalHours, 0);
  const totalCost = Math.round(totalCoveredHours * averageHourlyRate);

  // Calculate overall statistics
  const averageShiftsPerEmployee = totalAssignedShifts / employees.length;
  const averageHoursPerEmployee = totalCoveredHours / employees.length;
  
  // Helper functions for color coding
  const getCoverageColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 90) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getWorkloadColor = (actualPercentage: number, targetPercentage: number) => {
    // Calculate the deviation from target percentage
    const deviation = Math.abs(actualPercentage - targetPercentage);
    const relativeDeviation = targetPercentage > 0 ? (deviation / targetPercentage) * 100 : 0;
    
    // Smart color logic based on how close actual is to target
    // Green: Within 15% relative deviation OR within 10 percentage points for low targets
    const isCloseToTarget = relativeDeviation <= 15 || deviation <= 10;
    
    // Yellow: Within 30% relative deviation OR within 20 percentage points  
    const isModeratelyOff = relativeDeviation <= 30 || deviation <= 20;
    
    if (isCloseToTarget) {
      return 'text-green-600 bg-green-50 border-green-200';
    } else if (isModeratelyOff) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    } else {
      return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getCoverageIcon = (percentage: number) => {
    if (percentage >= 100) return <CheckCircle className="h-6 w-6 text-green-600" />;
    if (percentage >= 90) return <HelpCircle className="h-6 w-6 text-yellow-600" />;
    return <XCircle className="h-6 w-6 text-red-600" />;
  };

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
                <h2 className="text-xl font-bold">Schema sammanfattning</h2>
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
          {/* Partial Coverage Warning */}
          {coverageStats && coverageStats.coverage_percentage < 100 && (
            <PartialCoverageWarning coverageStats={coverageStats} />
          )}
          
          {/* Coverage Alert */}
          <div className={`mb-6 p-4 rounded-lg border ${getCoverageColor(coveragePercentage)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getCoverageIcon(coveragePercentage)}
                <div>
                  <h3 className="font-semibold text-lg">Täckningsgrad: {coveragePercentage}%</h3>
                  <p className="text-sm opacity-75">
                    {totalCoveredShifts} av {totalRequiredShifts} pass täckta
                  </p>
                </div>
              </div>
              {coveragePercentage < 100 && (
                <button
                  onClick={() => setShowCoverageDetails(!showCoverageDetails)}
                  className="flex items-center space-x-1 text-sm hover:underline"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Varför?</span>
                </button>
              )}
            </div>
            
            {showCoverageDetails && coveragePercentage < 100 && (
              <div className="mt-3 p-3 bg-white/50 rounded border text-sm">
                <p className="font-medium mb-2">Möjliga orsaker till ofullständig täckning:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Otillräckligt antal medarbetare för alla pass</li>
                  <li>Medarbetares tidsbegränsningar och preferenser</li>
                  <li>Erfarenhetskrav kan inte uppfyllas för vissa pass</li>
                  <li>Komplexa schemaläggningsregler begränsar möjligheterna</li>
                  {staffingIssues.length > 0 && <li>Se "Ofyllda pass" sektionen nedan för detaljer</li>}
                </ul>
              </div>
            )}
          </div>

          {/* Overall Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Totalt Pass</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-1">{totalAssignedShifts}</p>
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

            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">Total Kostnad</span>
              </div>
              <p className="text-2xl font-bold text-emerald-900 mt-1">{totalCost.toLocaleString()} SEK</p>
            </div>
          </div>

          {/* Optimization Score Comparison */}
          {currentOptimizationScore !== undefined && (
            <div className="mb-8">
              <OptimizationScoreComparison
                currentScore={currentOptimizationScore}
                previousScore={previousOptimizationScore}
                showComparison={previousOptimizationScore !== undefined}
              />
            </div>
          )}

          {/* Unfilled Shifts Section */}
          {staffingIssues.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span>Ofyllda Pass</span>
                <span className="text-sm font-normal text-red-600">
                  ({staffingIssues.length} pass kunde inte fyllas)
                </span>
              </h3>
              
              <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
                <div className="p-4 bg-red-100 border-b border-red-200">
                  <div className="flex items-center space-x-2">
                    <Info className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      Dessa pass kunde inte fyllas på grund av personalens begränsningar och schemaläggningsregler
                    </span>
                  </div>
                </div>
                
                <div className="divide-y divide-red-200">
                  {staffingIssues.map((issue, index) => {
                    const shiftTypeNames: { [key: string]: string } = {
                      'day': 'Dag',
                      'evening': 'Kväll', 
                      'night': 'Natt'
                    };
                    
                    const formattedDate = format(new Date(issue.date), 'EEEE d MMMM', { locale: sv });
                    const shortage = issue.required - issue.current;
                    
                    return (
                      <div key={index} className="p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-red-600" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 capitalize">{formattedDate}</p>
                            <p className="text-sm text-gray-600">
                              {shiftTypeNames[issue.shiftType] || issue.shiftType}pass
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm font-medium text-red-700">
                            Saknas: {shortage} person{shortage !== 1 ? 'er' : ''}
                          </p>
                          <p className="text-xs text-gray-500">
                            Har: {issue.current} / Behöver: {issue.required}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="p-4 bg-yellow-50 border-t border-red-200">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Förslag på åtgärder:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Kontrollera om personal kan ta övertid för dessa pass</li>
                        <li>Överväg att justera schemaläggningsreglerna tillfälligt</li>
                        <li>Se över möjligheten att rekrytera vikarier</li>
                        <li>Kontakta personal för att diskutera flexibilitet</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                      Arbetsbörda
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
                          <button
                            onClick={() => handleEmployeeClick(summary.id)}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline transition-all duration-200 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 py-0.5"
                            title="Klicka för att visa medarbetarens preferenser"
                          >
                            {summary.name}
                          </button>
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
                        <div className="flex items-center space-x-2">
                          <div className={`w-16 h-2 rounded-full ${getWorkloadColor(summary.workloadPercentage, summary.targetWorkPercentage)}`}>
                            <div 
                              className="h-full rounded-full bg-current opacity-60" 
                              style={{ width: `${Math.min(summary.workloadPercentage, 100)}%` }}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {summary.workloadPercentage}%
                            </span>
                            <span className="text-xs text-gray-500">
                              (mål: {summary.targetWorkPercentage}%)
                            </span>
                          </div>
                        </div>
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
                              style={{ width: `${(summary.experienceLevel / 5) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{summary.experienceLevel}/5</span>
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
            
            <div className="flex items-center space-x-3">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Avbryt</span>
                </button>
              )}
              
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-red-600 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all shadow-lg flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Generera Om</span>
                </button>
              )}
              
              {onAccept ? (
                <button
                  onClick={onAccept}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all shadow-lg flex items-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Acceptera Schema</span>
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-blue-600 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all shadow-lg"
                >
                  Stäng
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(modalContent, document.body)}
      
      {/* Employee Preferences Modal */}
      <EmployeePreferencesModal
        employee={selectedEmployee}
        isOpen={showEmployeePreferences}
        onClose={() => {
          setShowEmployeePreferences(false);
          setSelectedEmployee(null);
        }}
      />
    </>
  );
};
