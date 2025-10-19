/**
 * Natural language constraint parser
 * Converts Swedish text like "Anna ska inte jobba natt 15 november" to structured constraints
 */

export interface ParsedConstraint {
  type: 'hard_blocked_slot' | 'preferred_shift' | 'min_experience' | 'unknown';
  employee?: string;
  employeeId?: string;
  dates?: string[];
  shifts?: ('day' | 'evening' | 'night')[];
  isHard?: boolean; // true = strict constraint, false = soft preference
  minExperience?: number;
  originalText: string;
  confidence: 'high' | 'medium' | 'low';
}

// Swedish month names mapping
const MONTHS: Record<string, number> = {
  'januari': 1, 'februari': 2, 'mars': 3, 'april': 4,
  'maj': 5, 'juni': 6, 'juli': 7, 'augusti': 8,
  'september': 9, 'oktober': 10, 'november': 11, 'december': 12,
  'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4,
  'jun': 6, 'jul': 7, 'aug': 8,
  'sep': 9, 'okt': 10, 'nov': 11, 'dec': 12,
};

// Shift type keywords
const SHIFT_KEYWORDS: Record<string, 'day' | 'evening' | 'night'> = {
  'dag': 'day',
  'dagskift': 'day',
  'kväll': 'evening',
  'kvällsskift': 'evening',
  'natt': 'night',
  'nattskift': 'night',
};

/**
 * Parse natural language constraint text to structured format
 */
export function parseConstraint(
  text: string,
  availableEmployees: Array<{ id: string; first_name: string; last_name: string }>
): ParsedConstraint {
  const lowerText = text.toLowerCase().trim();

  // Try to identify employee name
  let employee: string | undefined;
  let employeeId: string | undefined;
  
  for (const emp of availableEmployees) {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    const firstName = emp.first_name.toLowerCase();
    
    if (lowerText.includes(fullName)) {
      employee = `${emp.first_name} ${emp.last_name}`;
      employeeId = emp.id;
      break;
    } else if (lowerText.includes(firstName)) {
      employee = `${emp.first_name} ${emp.last_name}`;
      employeeId = emp.id;
      break;
    }
  }

  // Identify if it's a hard constraint or soft preference
  const hardKeywords = ['ska inte', 'kan inte', 'måste', 'får inte', 'behöver'];
  const softKeywords = ['vill inte', 'föredrar inte', 'helst inte', 'gärna inte'];
  
  const isHard = hardKeywords.some(keyword => lowerText.includes(keyword));
  const isSoft = softKeywords.some(keyword => lowerText.includes(keyword));

  // Parse shift types
  const shifts: ('day' | 'evening' | 'night')[] = [];
  for (const [keyword, shiftType] of Object.entries(SHIFT_KEYWORDS)) {
    if (lowerText.includes(keyword)) {
      shifts.push(shiftType);
    }
  }

  // Parse dates
  const dates = parseDates(lowerText);

  // Determine constraint type
  if (employee && shifts.length > 0 && dates.length > 0) {
    return {
      type: 'hard_blocked_slot',
      employee,
      employeeId,
      dates,
      shifts,
      isHard: isHard || !isSoft, // Default to hard if not explicitly soft
      originalText: text,
      confidence: 'high',
    };
  } else if (employee && shifts.length > 0) {
    return {
      type: 'preferred_shift',
      employee,
      employeeId,
      shifts,
      isHard: isHard,
      originalText: text,
      confidence: dates.length === 0 ? 'medium' : 'high',
    };
  }

  // Couldn't parse - return unknown with low confidence
  return {
    type: 'unknown',
    originalText: text,
    confidence: 'low',
  };
}

/**
 * Parse dates from text
 * Supports formats:
 * - "15 november"
 * - "15-17 november"  
 * - "nästa måndag"
 * - "23:e"
 */
function parseDates(text: string): string[] {
  const dates: string[] = [];
  const currentYear = new Date().getFullYear();

  // Pattern: "15 november" or "15-17 november"
  const monthPattern = /(\d{1,2})(?:-(\d{1,2}))?\s+(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december|jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec)/gi;
  
  let match;
  while ((match = monthPattern.exec(text)) !== null) {
    const startDay = parseInt(match[1]);
    const endDay = match[2] ? parseInt(match[2]) : startDay;
    const monthName = match[3].toLowerCase();
    const month = MONTHS[monthName];

    if (month) {
      for (let day = startDay; day <= endDay; day++) {
        const date = new Date(currentYear, month - 1, day);
        dates.push(date.toISOString().split('T')[0]);
      }
    }
  }

  // Pattern: "23:e" (ordinal day number - assume current month)
  const ordinalPattern = /(\d{1,2}):e/g;
  while ((match = ordinalPattern.exec(text)) !== null) {
    const day = parseInt(match[1]);
    const currentMonth = new Date().getMonth();
    const date = new Date(currentYear, currentMonth, day);
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
}

/**
 * Batch parse multiple constraints
 */
export function parseConstraints(
  texts: string[],
  availableEmployees: Array<{ id: string; first_name: string; last_name: string }>
): ParsedConstraint[] {
  return texts
    .map(text => text.trim())
    .filter(text => text.length > 0)
    .map(text => parseConstraint(text, availableEmployees));
}

/**
 * Format parsed constraint for display
 */
export function formatConstraintDescription(constraint: ParsedConstraint): string {
  if (constraint.type === 'hard_blocked_slot' && constraint.employee) {
    const shiftStr = constraint.shifts?.map(s => 
      s === 'day' ? 'dag' : s === 'evening' ? 'kväll' : 'natt'
    ).join(', ');
    
    const dateStr = constraint.dates && constraint.dates.length > 0
      ? constraint.dates.length === 1
        ? new Date(constraint.dates[0]).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })
        : `${constraint.dates.length} dagar`
      : 'okänt datum';

    return `${constraint.employee} ${constraint.isHard ? 'kan inte' : 'föredrar att inte'} jobba ${shiftStr} ${dateStr}`;
  }

  if (constraint.type === 'preferred_shift' && constraint.employee) {
    const shiftStr = constraint.shifts?.map(s => 
      s === 'day' ? 'dag' : s === 'evening' ? 'kväll' : 'natt'
    ).join(', ');
    
    return `${constraint.employee} ${constraint.isHard ? 'kan inte' : 'föredrar att inte'} jobba ${shiftStr}`;
  }

  return constraint.originalText;
}
