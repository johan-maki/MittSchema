# 🔍 Schedule Filter System Guide

## Översikt

Filtreringssystemet för schemaläggning ger chefer kraftfulla verktyg för att visa relevanta pass baserat på olika kriterier. Systemet är integrerat i alla kalendervyer (Dag, Vecka, Månad, Gantt, och Redigeringsvy).

## Tillgängliga Filter

### 1. **Anställd** 👤
- **Typ**: Single-select dropdown
- **Funktion**: Visa endast pass för en specifik anställd
- **Användningsfall**: 
  - Granska en enskild medarbetares schema
  - Kontrollera arbetstider för specifik personal
  - Identifiera konflikter för individuell anställd

### 2. **Avdelning** 🏥
- **Typ**: Single-select dropdown
- **Funktion**: Filtrera pass per avdelning/roll
- **Auto-population**: Dynamiskt uppdaterad från employee.role
- **Användningsfall**:
  - Visa endast sjuksköterskor eller undersköterskor
  - Avdelningsspecifik schemaöversikt
  - Resursallokering per avdelning

### 3. **Skifttyp** ⏰
- **Typ**: Single-select dropdown
- **Alternativ**:
  - 🌅 Dag (07:00-15:00)
  - 🌆 Kväll (15:00-23:00)
  - 🌙 Natt (23:00-07:00)
  - Alla skift
- **Användningsfall**:
  - Granska endast nattskift
  - Balansera dagsbemanningen
  - Identifiera över/underbemannade skifttyper

### 4. **Erfarenhetsnivå** ⭐
- **Typ**: Single-select dropdown
- **Alternativ**:
  - ⭐ Nivå 1 (Junior)
  - ⭐⭐ Nivå 2 (Medel)
  - ⭐⭐⭐ Nivå 3 (Senior)
  - Alla nivåer
- **Användningsfall**:
  - Säkerställa erfaren personal på kritiska skift
  - Balansera kompetens över dygnet
  - Utbildningsplanering för juniorer

### 5. **Publiceringsstatus** ✅
- **Typ**: Single-select dropdown
- **Alternativ**:
  - ✅ Publicerade pass
  - 📝 Ej publicerade pass
  - Alla statusar
- **Användningsfall**:
  - Granska utkast innan publicering
  - Identifiera publicerade scheman
  - Kvalitetskontroll före release

## Funktioner

### 📊 Realtidsuppdatering
Filtret uppdateras omedelbart när kriterier ändras - ingen "Sök"-knapp behövs.

### 🎯 Kombinerade Filter
Alla filter kan kombineras för högprecisionssökning:
- **Exempel**: "Visa alla nattskift för erfarna sjuksköterskor som är publicerade"
- **Query**: Avdelning=Sjuksköterska + Skifttyp=Natt + Erfarenhet=Nivå 3 + Status=Publicerad

### 🏷️ Aktiva Filter-Badges
- Varje aktivt filter visas som en badge
- Klicka på X i badge för att snabbt ta bort det filtret
- Badge-färg: Indigo för visuell konsistens

### 📈 Filter-sammanfattning
Visar antal resultat och aktiva kriterier:
```
Visar 12 av 48 pass: Erik Eriksson, nattpass, nivå 3
```

### 🗑️ Rensa Filter
- **"Rensa alla"-knapp**: Återställer alla filter med ett klick
- **Individuell borttagning**: Klicka X på specifik badge
- **Empty state**: Hjälpsam feedback när inga pass matchar

## Teknisk Implementering

### Komponenter

#### `ScheduleFilters.tsx`
Huvudkomponent för filter-UI med:
- 5 select-dropdowns
- Aktiv filter-display med badges
- Responsiv grid-layout (1-5 kolumner beroende på skärmstorlek)
- TypeScript-säker med generisk updateFilter-funktion

#### `scheduleFilters.ts`
Utility-funktioner för filterlogik:
```typescript
filterShifts(shifts, filters) // Applicera filter på shifts
countActiveFilters(filters)    // Räkna aktiva filter
getUniqueDepartments(employees) // Extrahera unika avdelningar
getFilterSummary(...)          // Generera sammanfattningstext
```

### Prestanda

- **useMemo**: Filtrerade shifts cachas för att undvika onödiga omberäkningar
- **Incremental updates**: Endast relevanta vyer uppdateras vid filterändring
- **Smart re-rendering**: React.memo och useCallback där tillämpligt

### Integration

Alla vyer använder filtrerade shifts:
```tsx
// Dag-vy
<ModernDayView shifts={filteredShifts} />

// Vecko-vy
<ManagerScheduleView shifts={filteredShifts} />

// Månads-vy
<ModernMonthlySchedule shifts={shiftsWithProfiles} />

// Gantt-vy
<GanttScheduleView shifts={ganttShifts} />

// Redigerings-vy
<ScheduleEditorView shifts={editorShifts} />
```

## Användningsexempel

### Exempel 1: Granska nattbemanningen
1. Klicka "Filter" i headern
2. Välj "Skifttyp" → "🌙 Natt"
3. Se alla nattpass i vald vy
4. **Resultat**: "Visar 15 av 48 pass: nattpass"

### Exempel 2: Kontrollera en anställds schema
1. Öppna filter
2. Välj "Anställd" → "Anna Andersson"
3. Se Annas kompletta schema
4. **Resultat**: "Visar 8 av 48 pass: Anna Andersson"

### Exempel 3: Erfarna kvällssjuksköterskor
1. Aktivera filter
2. "Avdelning" → "Sjuksköterska"
3. "Skifttyp" → "🌆 Kväll"
4. "Erfarenhetsnivå" → "⭐⭐⭐ Nivå 3"
5. **Resultat**: "Visar 4 av 48 pass: Sjuksköterska, kvällspass, nivå 3"

### Exempel 4: Opublicerade pass för kvalitetskontroll
1. Öppna filter
2. "Status" → "📝 Ej publicerade"
3. Granska alla utkast
4. **Resultat**: "Visar 22 av 48 pass: ej publicerade"

## UX-detaljer

### Animationer
- Smooth expand/collapse av filter-panel (Framer Motion)
- Badge fade-in vid aktivering
- Empty state med subtil gradient-bakgrund

### Färgschema
- **Primary**: Indigo (filterknappar, badges)
- **Accent**: Purple (AI-funktioner)
- **Neutral**: Gray (text, borders)
- **Status**: Green/Yellow/Red (confidence, alerts)

### Responsivitet
- **Desktop (lg+)**: 5 kolumner side-by-side
- **Tablet (md)**: 2 kolumner
- **Mobile**: 1 kolumn stacked

### Tillgänglighet
- Keyboard-navigation genom alla filter
- Screen-reader-labels på alla inputs
- Tydliga focus-states
- ARIA-attribut för dropdowns

## Best Practices för Chefer

### 📅 Daglig Rutin
1. **Morgon**: Filtrera "ej publicerade" för att granska dagens ändringar
2. **Lunch**: Kontrollera "nattpass" för kommande natt
3. **Kväll**: Verifiera "publicerade" för nästa dag

### 🎯 Kvalitetskontroll
- Använd "Erfarenhetsnivå"-filter för att säkerställa balans
- Kombinera "Skifttyp + Avdelning" för avdelningsspecifik översikt
- Filtrera per anställd innan godkännande

### 📊 Rapportering
- Exportera filtrerade vyer för specifika rapporter
- Använd Gantt-vy med filter för visuella presentations
- Kombinera filter för att hitta mönster

## Tekniska Detaljer för Utvecklare

### Type Definitions
```typescript
interface ScheduleFilterOptions {
  employee?: string;
  department?: string;
  shiftType?: 'day' | 'evening' | 'night' | 'all';
  experienceLevel?: number | 'all';
  publicationStatus?: 'published' | 'unpublished' | 'all';
}
```

### Filter Logic
```typescript
// Employee filter
if (filters.employee) {
  filtered = filtered.filter(shift => 
    shift.employee_id === filters.employee
  );
}

// Department filter (via profiles)
if (filters.department) {
  filtered = filtered.filter(shift => {
    const profile = shift.profiles as { role?: string };
    return profile.role === filters.department;
  });
}

// Shift type filter
if (filters.shiftType && filters.shiftType !== 'all') {
  filtered = filtered.filter(shift => 
    shift.shift_type === filters.shiftType
  );
}
```

### State Management
```typescript
const [filters, setFilters] = useState<ScheduleFilterOptions>({
  shiftType: 'all',
  experienceLevel: 'all',
  publicationStatus: 'all',
});

// Memoized filtering
const filteredShifts = useMemo(() => 
  filterShifts(typedShifts, filters), 
  [typedShifts, filters]
);
```

## Framtida Förbättringar

### Planerade Features
- 📅 **Datumintervall-filter**: Filtrera mellan specifika datum
- 🔔 **Sparade filter**: Spara och återanvänd vanliga filterkombinationer
- 📊 **Export**: Exportera filtrerade resultat till Excel/PDF
- 🔍 **Fritextsökning**: Sök på anställningsnamn direkt
- 📱 **Snabbfilter**: Fördefinierade filter-knappar (t.ex. "Bara natt", "Ej publicerade")
- 🎨 **Färgkodning**: Olika färger för olika filter-typer
- 📈 **Statistik**: Visa aggregerad data för filtrerade resultat

### Prestanda-optimeringar
- Virtualized lists för stora dataset
- Web Worker för filterberäkningar
- Indexerad sökning för snabbare queries

## Support & Feedback

För bugrapporter eller feature-förfrågningar, kontakta utvecklingsteamet eller skapa en issue i projektet.
