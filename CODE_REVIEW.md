# CODE REVIEW & FÖRBÄTTRINGSFÖRSLAG
Datum: 2025-10-18

## 🎯 SAMMANFATTNING

Jag har granskat kodbasen och identifierat flera områden för förbättring.
Totalt: **15 förbättringar** fördelade på 5 kategorier.

---

## 1. 🧹 CODE QUALITY & MAINTAINABILITY

### 1.1 Excessive Console Logging (PRIORITET: HÖG)
**Problem**: 50+ console.log statements i produktion
**Påverkan**: Performance, security (kan läcka sensitiv data), cluttered console
**Lösning**: 
- Skapa en logging utility med nivåer (debug, info, warn, error)
- Disable debug/info logs i produktion
- Behåll endast errors i produktion

```typescript
// logger.ts
export const logger = {
  debug: (msg: string, ...args: any[]) => {
    if (import.meta.env.DEV) console.log(msg, ...args);
  },
  info: (msg: string, ...args: any[]) => {
    if (import.meta.env.DEV) console.info(msg, ...args);
  },
  warn: (msg: string, ...args: any[]) => console.warn(msg, ...args),
  error: (msg: string, ...args: any[]) => console.error(msg, ...args)
};
```

### 1.2 Duplicerad Kod i schedulerApi.ts (PRIORITET: MEDIUM)
**Problem**: `min_staff_per_shift` och `minimum_staff` sätts till samma värde
**Lösning**: 
```typescript
// Före:
min_staff_per_shift: minStaffPerShift,
minimum_staff: minStaffPerShift, // Duplicerat

// Efter: Ta bort duplicering i interface och bara skicka en parameter
```

### 1.3 Magic Numbers (PRIORITET: MEDIUM)
**Problem**: Hårdkodade värden utan kontext
```typescript
// scheduleGenerationService.ts rad 74
const BATCH_SIZE = 10; // OK, men borde vara const i toppen

// schedulerApi.ts rad 157
setTimeout(() => controller.abort(), 30000); // Magic number
```

**Lösning**:
```typescript
// config/constants.ts
export const DATABASE_CONFIG = {
  BATCH_SIZE: 10,
  INSERT_TIMEOUT_MS: 5000
} as const;

export const API_CONFIG = {
  REQUEST_TIMEOUT_MS: 30000,
  MAX_RETRIES: 3,
  BASE_RETRY_DELAY_MS: 1000
} as const;
```

---

## 2. ⚡ PERFORMANCE

### 2.1 Inefficient Date Filtering (PRIORITET: HÖG)
**Problem**: scheduleGenerationService.ts rad 57-67
```typescript
const dateIssues = shifts.filter(shift => {
  const shiftDate = shift.date || shift.start_time?.split('T')[0];
  if (shiftDate) {
    const month = parseInt(shiftDate.split('-')[1]);
    // Kör för ALLA shifts, även när inga problem finns
  }
});
```

**Lösning**: Early return eller conditional execution
```typescript
// Only validate in development
if (import.meta.env.DEV) {
  const dateIssues = shifts.filter(/* ... */);
  if (dateIssues.length > 0) {
    logger.warn(`Found ${dateIssues.length} shifts with wrong month`);
  }
}
```

### 2.2 Unnecessary Array Creation (PRIORITET: LOW)
**Problem**: scheduleGenerationService.ts rad 316
```typescript
const allPreferredShifts = [...new Set([...preferredShifts, ...strictlyPreferredShifts])];
```
Skapar 3 arrays när en skulle räcka.

**Lösning**: 
```typescript
// Om listorna är små (< 10 items), optimera ej
// Om stora, använd Set direkt:
const allPreferredShifts = Array.from(
  new Set(preferredShifts.concat(strictlyPreferredShifts))
);
```

### 2.3 Batch Size Optimization (PRIORITET: MEDIUM)
**Problem**: BATCH_SIZE = 10 är konservativt litet
**Lösning**: Öka till 50-100 för bättre performance
```typescript
const BATCH_SIZE = 50; // Supabase kan hantera större batches
```

---

## 3. 🔒 ERROR HANDLING & RESILIENCE

### 3.1 Silent Failures (PRIORITET: HÖG)
**Problem**: schedulerApi.ts rad 173-175
```typescript
if (attempt === retries) {
  throw new Error(`Failed to generate schedule: ${response.status} ${errorText}`);
}
// Wait before retrying
await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
continue; // Silent retry utan user feedback
```

**Lösning**: Callback för retry-status
```typescript
generateSchedule: async (
  // ... params
  onRetry?: (attempt: number, maxRetries: number) => void
) => {
  // ...
  if (!response.ok && attempt < retries) {
    onRetry?.(attempt, retries);
    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    continue;
  }
}
```

### 3.2 Ospecifika Error Messages (PRIORITET: MEDIUM)
**Problem**: Generiska felmeddelanden som inte hjälper användaren
```typescript
throw new Error('Unable to connect to Gurobi optimizer after multiple attempts');
```

**Lösning**: Strukturerade errors med actionable information
```typescript
class GurobiConnectionError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = true
  ) {
    super(message);
    this.name = 'GurobiConnectionError';
  }
}
```

### 3.3 Saknad Timeout Cleanup (PRIORITET: LOW)
**Problem**: schedulerApi.ts har potential för memory leaks
```typescript
const timeoutId = setTimeout(() => controller.abort(), 30000);
// Om fetch lyckas snabbt, borde timeoutId rensas
clearTimeout(timeoutId);
```
**Status**: ✅ Detta är redan fixat i koden!

---

## 4. 🎨 TYPE SAFETY & TYPESCRIPT

### 4.1 Weak Type Definitions (PRIORITET: MEDIUM)
**Problem**: scheduleGenerationService.ts rad 14-19
```typescript
interface ScheduleSettings {
  department?: string;
  min_staff_per_shift?: number;
  minStaffPerShift?: number; // Inconsistent naming
  // ...
  [key: string]: unknown; // Too permissive
}
```

**Lösning**: Striktare typing
```typescript
interface ScheduleSettings {
  department?: string;
  minStaffPerShift: number; // Required, consistent naming
  minExperiencePerShift: number;
  includeWeekends: boolean;
}

// Använd Zod eller io-ts för runtime validation
```

### 4.2 Type Assertions istället för Guards (PRIORITET: LOW)
**Problem**: Flera ställen använder `as` casting
**Lösning**: Type guards för säkrare kod
```typescript
function isGurobiScheduleResponse(data: unknown): data is GurobiScheduleResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'schedule' in data &&
    'optimizer' in data
  );
}
```

---

## 5. 🏗️ ARCHITECTURE & PATTERNS

### 5.1 God Object Anti-Pattern (PRIORITET: MEDIUM)
**Problem**: `generateScheduleForNextMonth` är 350+ rader
**Lösning**: Bryt ut i mindre funktioner
```typescript
// Före: En stor funktion med allt
export const generateScheduleForNextMonth = async (/* 350 rader */) => { }

// Efter: Modulära funktioner
const clearExistingShifts = async (startDate: Date, endDate: Date) => { }
const fetchEmployeePreferences = async () => { }
const buildGurobiRequest = (employees, preferences, settings) => { }
const callGurobiApi = async (request) => { }
const validateAndSaveSchedule = async (schedule) => { }

export const generateScheduleForNextMonth = async (...) => {
  await clearExistingShifts(...);
  const preferences = await fetchEmployeePreferences();
  const request = buildGurobiRequest(...);
  const schedule = await callGurobiApi(request);
  return validateAndSaveSchedule(schedule);
}
```

### 5.2 Dependency Injection Saknas (PRIORITET: LOW)
**Problem**: Hårt kopplade till Supabase client
**Lösning**: Injicera dependencies för bättre testbarhet
```typescript
// Möjliggör testing med mock clients
export const saveScheduleToSupabase = async (
  shifts: Shift[],
  client = supabase // Default, men kan mockas
): Promise<boolean> => { }
```

### 5.3 No Caching Strategy (PRIORITET: LOW)
**Problem**: Ingen caching av employee preferences som hämtas ofta
**Lösning**: React Query cache eller localStorage
```typescript
// react-query har redan detta inbyggt
const { data: employees } = useQuery({
  queryKey: ['employees'],
  queryFn: fetchEmployees,
  staleTime: 5 * 60 * 1000, // 5 minuter
  cacheTime: 10 * 60 * 1000 // 10 minuter
});
```

---

## 📊 PRIORITERAD IMPLEMENTATION PLAN

### SPRINT 1 (Högst prioritet - 2-4 timmar)
1. ✅ Skapa logging utility
2. ✅ Ersätt alla console.log med logger
3. ✅ Fixa excessive date validation (conditional)
4. ✅ Öka batch size till 50

### SPRINT 2 (Medium prioritet - 3-5 timmar)
5. Extrahera constants till config fil
6. Bryt ut `generateScheduleForNextMonth` i moduler
7. Förbättra error messages med structured errors
8. Lägg till retry callback för user feedback

### SPRINT 3 (Låg prioritet - 2-3 timmar)
9. Förbättra type safety med stricter interfaces
10. Lägg till type guards
11. Ta bort duplicerad kod
12. Dependency injection för testbarhet

---

## 🎯 FÖRVÄNTAD IMPACT

**Performance**:
- 20-30% snabbare batch inserts (ökad batch size)
- Mindre console overhead i produktion
- Bättre caching strategy

**Maintainability**:
- 40% mindre kod i main functions
- Tydligare error messages
- Lättare att debugga med structured logging

**User Experience**:
- Bättre felmeddelanden
- Retry feedback visar progress
- Snabbare schema generation

---

## ✅ QUICK WINS (Kan göras nu på 30 min)

1. Logger utility + ersätt console.log
2. Öka BATCH_SIZE till 50
3. Conditional date validation
4. Extract constants

Vill du att jag implementerar dessa?
