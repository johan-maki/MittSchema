// Test constraint parser
const testEmployees = [
  { id: '1', first_name: 'Anna', last_name: 'Andersson' },
  { id: '2', first_name: 'Erik', last_name: 'Eriksson' },
  { id: '3', first_name: 'Sara', last_name: 'Svensson' },
];

const MONTHS = {
  'januari': 1, 'februari': 2, 'mars': 3, 'april': 4,
  'maj': 5, 'juni': 6, 'juli': 7, 'augusti': 8,
  'september': 9, 'oktober': 10, 'november': 11, 'december': 12,
  'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4,
  'jun': 6, 'jul': 7, 'aug': 8,
  'sep': 9, 'okt': 10, 'nov': 11, 'dec': 12,
};

const SHIFT_KEYWORDS = {
  'dag': 'day',
  'dagskift': 'day',
  'kväll': 'evening',
  'kvällsskift': 'evening',
  'natt': 'night',
  'nattskift': 'night',
};

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
  
  for (const emp of availableEmployees) {
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    const firstName = emp.first_name.toLowerCase();
    
    console.log(`Checking employee: ${emp.first_name} ${emp.last_name}`, {
      fullName,
      firstName,
      matchesFullName: lowerText.includes(fullName),
      matchesFirstName: lowerText.includes(firstName)
    });
    
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
  const shifts = [];
  
  // Special case: "ledigt" means blocked from ALL shifts
  const hasLedigit = lowerText.includes('ledigt') || lowerText.includes('ledig');
  
  if (hasLedigit) {
    console.log('Found "ledigt" - blocking all shifts');
    shifts.push('day', 'evening', 'night');
  } else {
    // Normal shift keyword matching
    for (const [keyword, shiftType] of Object.entries(SHIFT_KEYWORDS)) {
      if (lowerText.includes(keyword)) {
        console.log(`Found shift keyword: ${keyword} -> ${shiftType}`);
        shifts.push(shiftType);
      }
    }
  }

  // Parse dates
  const dates = parseDates(lowerText);

  console.log('\nParsed results:', { employee, employeeId, shifts, dates, isHard, isSoft });

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
    };
  }

  return {
    type: 'unknown',
    originalText: text,
    confidence: 'low',
  };
}

// Test cases
console.log('Testing constraint parser\n');
console.log('='.repeat(60));

const testCases = [
  'anna ska inte jobba natt 15 november',
  'Erik måste ha ledigt 23e november',
];

testCases.forEach(testCase => {
  console.log('\n' + '='.repeat(60));
  const result = parseConstraint(testCase, testEmployees);
  console.log('\n📊 FINAL RESULT:');
  console.log(JSON.stringify(result, null, 2));
  console.log('='.repeat(60));
});
