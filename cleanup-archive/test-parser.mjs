// Test constraint parser
const testEmployees = [
  { id: '1', first_name: 'Anna', last_name: 'Andersson' },
  { id: '2', first_name: 'Erik', last_name: 'Eriksson' },
  { id: '3', first_name: 'Sara', last_name: 'Svensson' },
  { id: '4', first_name: 'Charlotte', last_name: 'Bergström' },
];

const MONTHS = {
  'januari': 1, 'februari': 2, 'mars': 3, 'april': 4,
  'maj': 5, 'juni': 6, 'juli': 7, 'augusti': 8,
  'september': 9, 'oktober': 10, 'november': 11, 'december': 12,
  'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4,
  'jun': 6, 'jul': 7, 'aug': 8,
  'sep': 9, 'okt': 10, 'nov': 11, 'dec': 12,
};

const WEEKDAYS = {
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

const SHIFT_KEYWORDS = {
  'dagskift': 'day',
  'kvällsskift': 'evening',
  'nattskift': 'night',
  'dag': 'day',
  'kväll': 'evening',
  'natt': 'night',
};

function parseDatesAndWeekdays(text) {
  const dates = [];
  let hasWeekday = false;
  const currentYear = new Date().getFullYear();

  // Check for weekdays FIRST
  for (const [weekdayName, weekdayNum] of Object.entries(WEEKDAYS)) {
    if (text.includes(weekdayName)) {
      hasWeekday = true;
      console.log(`Found weekday: ${weekdayName} (${weekdayNum})`);
      
      const today = new Date();
      const currentDay = today.getDay();
      let daysUntilWeekday = weekdayNum - currentDay;
      
      if (daysUntilWeekday <= 0) {
        daysUntilWeekday += 7;
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
      console.log(`Next ${weekdayName}: ${dateStr}`);
      break;
    }
  }

  if (!hasWeekday) {
    // Parse regular dates
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

function parseDates(text) {
  const dates = [];
  const currentYear = new Date().getFullYear();

  console.log('\nParsing dates from:', text);

  // Pattern: "15 november", "15-17 november", "23e november" 
  const monthPattern = /(\d{1,2})(?:-(\d{1,2}))?(?::?e)?\s+(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december|jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec)/gi;
  
  let match;
  while ((match = monthPattern.exec(text)) !== null) {
    console.log('Month pattern match:', match);
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
        console.log(`Added date: ${dateStr} from ${day} ${monthName}`);
      }
    }
  }

  // Pattern: "23e" or "23:e" WITHOUT a month name (ordinal day number - assume current month)
  // Only match if NOT followed by a month name to avoid double-matching "23e november"
  const ordinalPattern = /(\d{1,2}):?e(?!\s+(?:januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december|jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec))/gi;
  while ((match = ordinalPattern.exec(text)) !== null) {
    console.log('Ordinal pattern match:', match);
    const day = parseInt(match[1]);
    const currentMonth = new Date().getMonth();
    const date = new Date(Date.UTC(currentYear, currentMonth, day, 12, 0, 0));
    const dateStr = date.toISOString().split('T')[0];
    dates.push(dateStr);
    console.log(`Added ordinal date: ${dateStr}`);
  }

  console.log('Final parsed dates:', dates);
  return dates;
}

function parseConstraint(text, availableEmployees) {
  const lowerText = text.toLowerCase().trim();

  console.log('\n=== Constraint Parser Debug ===');
  console.log('Input text:', text);
  console.log('Lower text:', lowerText);

  // Try to identify employee name
  let employee = undefined;
  let employeeId = undefined;
  let employeeNotFound = false;
  
  const words = lowerText.split(/\s+/);
  let potentialName = undefined;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (word.length >= 3 && /^[a-zåäö]+$/.test(word)) {
      const matched = availableEmployees.find(emp => 
        emp.first_name.toLowerCase() === word || 
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(word)
      );
      
      if (matched) {
        employee = `${matched.first_name} ${matched.last_name}`;
        employeeId = matched.id;
        console.log(`✅ Found employee: ${employee}`);
        break;
      } else if (i === 0 || (i === 1 && words[0].length <= 3)) {
        potentialName = word.charAt(0).toUpperCase() + word.slice(1);
        employeeNotFound = true;
        console.log(`❌ Potential name not in database: ${potentialName}`);
      }
    }
  }

  // Identify if it's a hard constraint or soft preference
  const hardKeywords = ['ska inte', 'kan inte', 'måste', 'får inte', 'behöver'];
  const softKeywords = ['vill inte', 'föredrar inte', 'helst inte', 'gärna inte'];
  
  const isHard = hardKeywords.some(keyword => lowerText.includes(keyword));
  const isSoft = softKeywords.some(keyword => lowerText.includes(keyword));

  // Parse dates - check for weekdays FIRST
  const { dates, hasWeekday } = parseDatesAndWeekdays(lowerText);

  // Parse shift types (but NOT if we found a weekday)
  const shifts = [];
  
  const hasLedigit = lowerText.includes('ledigt') || lowerText.includes('ledig');
  
  if (hasLedigit) {
    console.log('Found "ledigt" - blocking all shifts');
    shifts.push('day', 'evening', 'night');
  } else if (!hasWeekday) {
    const sortedKeywords = Object.entries(SHIFT_KEYWORDS).sort((a, b) => b[0].length - a[0].length);
    
    for (const [keyword, shiftType] of sortedKeywords) {
      if (lowerText.includes(keyword) && !shifts.includes(shiftType)) {
        console.log(`Found shift keyword: ${keyword} -> ${shiftType}`);
        shifts.push(shiftType);
      }
    }
  } else {
    console.log('Weekday found, assuming all shifts blocked for that day');
    shifts.push('day', 'evening', 'night');
  }

  // Build reason for low confidence
  let reason = undefined;
  if (employeeNotFound) {
    reason = `Ingen anställd med namnet "${potentialName}" finns i systemet`;
  } else if (!employee) {
    reason = 'Inget personnamn kunde identifieras';
  } else if (shifts.length === 0 && !hasWeekday) {
    reason = 'Ingen skifttyp eller veckodag kunde identifieras';
  } else if (dates.length === 0) {
    reason = 'Inget datum kunde identifieras';
  }

  console.log('\nParsed results:', { employee, employeeId, shifts, dates, isHard, isSoft, reason });

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

  return {
    type: 'unknown',
    originalText: text,
    confidence: 'low',
    reason: reason || 'Kunde inte tolka villkoret',
  };
}

// Test cases
console.log('Testing constraint parser\n');
console.log('='.repeat(60));

const testCases = [
  'anna ska inte jobba natt 15 november',
  'Erik måste ha ledigt 23e november',
  'charlotte kan inte jobba söndag',
  'Linda ska inte jobba dag 5 december',  // Linda finns inte i databasen
];

testCases.forEach(testCase => {
  console.log('\n' + '='.repeat(60));
  const result = parseConstraint(testCase, testEmployees);
  console.log('\n📊 FINAL RESULT:');
  console.log(JSON.stringify(result, null, 2));
  console.log('='.repeat(60));
});
