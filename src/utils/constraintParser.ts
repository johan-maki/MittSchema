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
  reason?: string; // Explanation for low confidence or parsing issues
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

// Weekday names (check these BEFORE shift types to avoid "söndag" matching "dag")
const WEEKDAYS: Record<string, number> = {
  'måndag': 1,
  'tisdag': 2,
  'onsdag': 3,
  'torsdag': 4,
  'fredag': 5,
  'lördag': 6,
  'söndag': 0,
  'mån': 1,
  'tis': 2,
  'ons': 3,
  'tor': 4,
  'fre': 5,
  'lör': 6,
  'sön': 0,
};

// Shift type keywords
const SHIFT_KEYWORDS: Record<string, 'day' | 'evening' | 'night'> = {
  'dagskift': 'day',
  'kvällsskift': 'evening',
  'nattskift': 'night',
  'dag': 'day',
  'kväll': 'evening',
  'natt': 'night',
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
  let employeeNotFound = false;
  
  // First, try to extract a name from the text
  const words = lowerText.split(/\s+/);
  let potentialName: string | undefined;
  
  // Common Swedish first names pattern - capitalize first letter for matching
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (word.length >= 3 && /^[a-zåäö]+$/.test(word)) {
      // Check if this word matches any employee
      const matched = availableEmployees.find(emp => 
        emp.first_name.toLowerCase() === word || 
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(word)
      );
      
      if (matched) {
        employee = `${matched.first_name} ${matched.last_name}`;
        employeeId = matched.id;
        break;
      } else if (i === 0 || (i === 1 && words[0].length <= 3)) {
        // Likely a name but not found in database
        potentialName = word.charAt(0).toUpperCase() + word.slice(1);
        employeeNotFound = true;
      }
    }
  }

  // Identify if it's a hard constraint or soft preference
  const hardKeywords = ['ska inte', 'kan inte', 'måste', 'får inte', 'behöver'];
  const softKeywords = ['vill inte', 'föredrar inte', 'helst inte', 'gärna inte'];
  
  const isHard = hardKeywords.some(keyword => lowerText.includes(keyword));
  const isSoft = softKeywords.some(keyword => lowerText.includes(keyword));

  // Parse dates - check for weekdays FIRST (before parsing other dates)
  const { dates, hasWeekday } = parseDatesAndWeekdays(lowerText);

  // Parse shift types (but NOT if we found a weekday, to avoid "söndag" matching "dag")
  const shifts: ('day' | 'evening' | 'night')[] = [];
  
  // Special case: "ledigt" means blocked from ALL shifts
  const hasLedigit = lowerText.includes('ledigt') || lowerText.includes('ledig');
  
  if (hasLedigit) {
    shifts.push('day', 'evening', 'night');
  } else if (!hasWeekday) {
    // Only check shift keywords if we didn't find a weekday
    // Check longer keywords first to avoid "dag" matching in "dagskift"
    const sortedKeywords = Object.entries(SHIFT_KEYWORDS).sort((a, b) => b[0].length - a[0].length);
    
    for (const [keyword, shiftType] of sortedKeywords) {
      if (lowerText.includes(keyword) && !shifts.includes(shiftType)) {
        shifts.push(shiftType);
      }
    }
  }

  // Build reason for low confidence
  let reason: string | undefined;
  if (employeeNotFound) {
    reason = `Ingen anställd med namnet "${potentialName}" finns i systemet`;
  } else if (!employee) {
    reason = 'Inget personnamn kunde identifieras';
  } else if (shifts.length === 0 && !hasWeekday) {
    reason = 'Ingen skifttyp eller veckodag kunde identifieras';
  } else if (dates.length === 0) {
    reason = 'Inget datum kunde identifieras';
  }

  // Determine constraint type
  if (employee && shifts.length > 0 && dates.length > 0) {
    return {
      type: 'hard_blocked_slot',
      employee,
      employeeId,
      dates,
      shifts,
      isHard: isHard || !isSoft,
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
      reason: dates.length === 0 ? 'Inget specifikt datum angivet' : undefined,
    };
  }

  // Couldn't parse - return unknown with low confidence
  return {
    type: 'unknown',
    originalText: text,
    confidence: 'low',
    reason: reason || 'Kunde inte tolka villkoret',
  };
}

/**
 * Parse dates and weekdays from text
 * Returns dates and a flag indicating if a weekday was found
 */
function parseDatesAndWeekdays(text: string): { dates: string[], hasWeekday: boolean } {
  const dates: string[] = [];
  let hasWeekday = false;
  const currentYear = new Date().getFullYear();

  // Check for weekdays FIRST (before shift keywords to avoid "söndag" matching "dag")
  for (const [weekdayName, weekdayNum] of Object.entries(WEEKDAYS)) {
    if (text.includes(weekdayName)) {
      hasWeekday = true;
      // Find the next occurrence of this weekday
      const today = new Date();
      const currentDay = today.getDay();
      let daysUntilWeekday = weekdayNum - currentDay;
      
      if (daysUntilWeekday <= 0) {
        daysUntilWeekday += 7; // Next week
      }
      
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysUntilWeekday);
      
      const dateStr = new Date(Date.UTC(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        12, 0, 0
      )).toISOString().split('T')[0];
      
      dates.push(dateStr);
      break; // Only match first weekday found
    }
  }

  // If no weekday found, parse regular dates
  if (!hasWeekday) {
    // Pattern: "15 november", "15-17 november", "23e november" 
    const monthPattern = /(\d{1,2})(?:-(\d{1,2}))?(?::?e)?\s+(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december|jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec)/gi;
    
    let match;
    while ((match = monthPattern.exec(text)) !== null) {
      const startDay = parseInt(match[1]);
      const endDay = match[2] ? parseInt(match[2]) : startDay;
      const monthName = match[3].toLowerCase();
      const month = MONTHS[monthName];

      if (month) {
        for (let day = startDay; day <= endDay; day++) {
          const date = new Date(Date.UTC(currentYear, month - 1, day, 12, 0, 0));
          const dateStr = date.toISOString().split('T')[0];
          dates.push(dateStr);
        }
      }
    }

    // Pattern: "23e" or "23:e" WITHOUT a month name
    const ordinalPattern = /(\d{1,2}):?e(?!\s+(?:januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december|jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec))/gi;
    while ((match = ordinalPattern.exec(text)) !== null) {
      const day = parseInt(match[1]);
      const currentMonth = new Date().getMonth();
      const date = new Date(Date.UTC(currentYear, currentMonth, day, 12, 0, 0));
      const dateStr = date.toISOString().split('T')[0];
      dates.push(dateStr);
    }
  }

  return { dates, hasWeekday };
}

/**
 * Parse dates from text (legacy function - kept for compatibility)
 * Supports formats:
 * - "15 november"
 * - "15-17 november"  
 * - "nästa måndag"
 * - "23:e"
 */
function parseDates(text: string): string[] {
  const dates: string[] = [];
  const currentYear = new Date().getFullYear();

  // Pattern: "15 november", "15-17 november", "23e november" 
  // The :?e? makes the ordinal suffix optional (23, 23e, or 23:e)
  const monthPattern = /(\d{1,2})(?:-(\d{1,2}))?(?::?e)?\s+(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december|jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec)/gi;
  
  let match;
  while ((match = monthPattern.exec(text)) !== null) {
    const startDay = parseInt(match[1]);
    const endDay = match[2] ? parseInt(match[2]) : startDay;
    const monthName = match[3].toLowerCase();
    const month = MONTHS[monthName];

    if (month) {
      for (let day = startDay; day <= endDay; day++) {
        // Create date at noon UTC to avoid timezone issues
        const date = new Date(Date.UTC(currentYear, month - 1, day, 12, 0, 0));
        const dateStr = date.toISOString().split('T')[0];
        dates.push(dateStr);
      }
    }
  }

  // Pattern: "23e" or "23:e" WITHOUT a month name (ordinal day number - assume current month)
  // Only match if NOT followed by a month name to avoid double-matching "23e november"
  const ordinalPattern = /(\d{1,2}):?e(?!\s+(?:januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december|jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec))/gi;
  while ((match = ordinalPattern.exec(text)) !== null) {
    const day = parseInt(match[1]);
    const currentMonth = new Date().getMonth();
    const date = new Date(Date.UTC(currentYear, currentMonth, day, 12, 0, 0));
    const dateStr = date.toISOString().split('T')[0];
    dates.push(dateStr);
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
