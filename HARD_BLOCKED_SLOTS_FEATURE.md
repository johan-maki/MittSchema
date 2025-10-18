# 🎯 Ny Funktionalitet: Hårdblockerade Arbetstillfällen

## 📋 Översikt

Vi har implementerat en helt ny approach för hur anställda hanterar sina arbetsönskemål:

### **Mjuka vs Hårda Krav**

#### **Mjuka Krav (Soft Preferences)**
- **Önskade arbetspass**: Toggle för Dag/Kväll/Natt
- **Tillgängliga dagar**: Toggle för Måndag-Söndag
- Schemaläggningen **försöker** respektera dessa men kan bryta vid behov
- Används när flexibilitet behövs

#### **Hårda Krav (Hard Constraints)**
- **Arbetstillfällen jag ej kan jobba**: Specifika datum + pass-kombinationer
- Max **3 arbetstillfällen** kan blockeras
- Schemaläggningen **MÅSTE** respektera dessa (absolut krav)
- Används för viktiga händelser: läkarbesök, studier, familjeåtaganden

---

## 🎨 Design & UX

### **Huvudvy (Work Preferences)**

**Önskade arbetspass:**
- Modern switch-toggle design
- Tydlig text: "Dessa är **mjuka preferenser**"
- Ingen "Hårt krav"-checkbox (flyttad till separat dialog)

**Ny knapp:**
```
┌────────────────────────────────────────────────┐
│  🚫  Ange arbetstillfällen jag ej kan jobba  │
│                                           [2/3] │
└────────────────────────────────────────────────┘
```

- Röd border + hover-effekt
- Badge visar antal blockerade (2/3)
- Tydlig visuell feedback

---

### **Kalender-Dialog**

**Status Bar:**
```
┌────────────────────────────────────────────────┐
│  2/3  Arbetstillfällen kvar att blockera      │
│       ✓ 1 blockerad                            │
└────────────────────────────────────────────────┘
```

**Visuell Design:**
- 📅 Full månadskalender (kommande månad)
- 🔴 Röd färgkodning för blockerade dagar
- 🔵 Blå highlight för vald dag
- ⚪ Disabled för föregångna dagar
- 🔵 Prickar under datum visar antal blockerade pass

**Blockerade arbetstillfällen visas som kort:**
```
┌────────────────────────────────────────────┐
│  15    Fredag 15 november                  │
│  Nov   [FM] [EM]                        ✕  │
└────────────────────────────────────────────┘
```

**Pass-val när dag är vald:**
```
┌────────────────────────────────────────────┐
│ Välj pass för 15 november              ✕  │
├────────────────────────────────────────────┤
│  ┌───────────┐  ┌───────────┐             │
│  │ FM        │  │ EM        │             │
│  │ 06-14     │  │ 14-22     │             │
│  └───────────┘  └───────────┘             │
│  ┌───────────┐  ┌───────────┐             │
│  │ Natt      │  │ Heldag    │             │
│  │ 22-06     │  │ Alla pass │             │
│  └───────────┘  └───────────┘             │
│                                            │
│  [✓ Bekräfta blockering]                  │
└────────────────────────────────────────────┘
```

**Färgkodning:**
- 🟡 FM (Amber)
- 🔵 EM (Blue)  
- 🟣 Natt (Indigo)
- ⚫ Heldag (Slate)

---

## 💾 Data Structure

### **TypeScript Type:**
```typescript
export type HardBlockedSlot = {
  date: string; // ISO format: "2025-11-15"
  shift_types: ('day' | 'evening' | 'night' | 'all_day')[];
};

export interface WorkPreferences {
  work_percentage: number;
  day_constraints: {...};
  shift_constraints: {...};
  hard_blocked_slots: HardBlockedSlot[]; // ← NYTT!
}
```

### **Exempel i Databas:**
```json
{
  "work_percentage": 100,
  "shift_constraints": {
    "day": { "preferred": true, "strict": false },
    "evening": { "preferred": true, "strict": false },
    "night": { "preferred": false, "strict": false }
  },
  "day_constraints": {...},
  "hard_blocked_slots": [
    {
      "date": "2025-11-15",
      "shift_types": ["day", "evening"]
    },
    {
      "date": "2025-11-22",
      "shift_types": ["all_day"]
    }
  ]
}
```

---

## 🔄 User Flow

### **Scenario: Anställd kan inte jobba 15 nov (FM + EM)**

1. **Öppna dialog:**
   - Klicka "Ange arbetstillfällen jag ej kan jobba"
   - Status: "3/3 Arbetstillfällen kvar"

2. **Välj datum:**
   - Klicka på 15 november i kalendern
   - Dag highlightas blått
   - Pass-väljare visas

3. **Välj pass:**
   - Klicka FM → blir amber
   - Klicka EM → blir blå
   - Klicka "Bekräfta blockering"

4. **Resultat:**
   - Kort visas: "15 Nov | Fredag | FM EM"
   - Status: "2/3 Arbetstillfällen kvar"
   - Kalender visar 2 prickar under 15:e

5. **Ta bort:**
   - Klicka ✕ på kortet
   - Blockering tas bort
   - Status: "3/3 Arbetstillfällen kvar"

---

## 🎯 Validering & Constraints

### **Max 3 Arbetstillfällen**
- Visuell feedback: "0/3 kvar"
- Disabled state på kalender när max nådd
- Måste ta bort för att lägga till nya

### **Endast Kommande Månad**
- Visar automatiskt nästa månad
- Föregångna dagar är disabled
- Förhindrar retroaktiv blockering

### **Pass-Kombinationer**
- Kan välja flera pass per dag (FM + EM)
- "Heldag" exkluderar andra val automatiskt
- "Heldag" = alla 3 pass blockerade

---

## 🔧 Teknisk Implementation

### **Komponenter:**
- `HardBlockedSlotsDialog.tsx` - Kalender-dialog (312 rader)
- `WorkPreferences.tsx` - Huvudkomponent (uppdaterad)
- `profile.ts` - Typ-definitioner (uppdaterad)

### **Dependencies:**
- `date-fns` - Datum-hantering
- `shadcn/ui` - Dialog, Badge, Button
- `lucide-react` - Icons

### **State Management:**
```typescript
const [selectedSlots, setSelectedSlots] = useState<HardBlockedSlot[]>([]);
const [selectedDate, setSelectedDate] = useState<Date | null>(null);
const [selectedShifts, setSelectedShifts] = useState<Set<string>>(new Set());
```

---

## ✅ Framtida Integration med Gurobi

När denna data når Gurobi-optimeraren ska den hanteras som:

```python
# scheduler-api/services/gurobi_optimizer_service.py

# För varje blockerat arbetstillfälle:
for slot in employee.hard_blocked_slots:
    date = parse_date(slot['date'])  # "2025-11-15"
    
    for shift_type in slot['shift_types']:
        # HARD CONSTRAINT: Sätt variabel till 0
        model.addConstr(
            shifts[(employee_id, date, shift_type)] == 0,
            name=f"hard_blocked_{employee_id}_{date}_{shift_type}"
        )
```

Detta garanterar att Gurobi **aldrig** schemaläggare anställd på blockerade tillfällen.

---

## 🎨 Design Philosophy

### **Separation of Concerns:**
- **Soft Preferences** → Huvudvyn (toggles)
- **Hard Constraints** → Separat dialog (kalender)

### **Progressive Disclosure:**
- Visa enkel vy först
- Avancerad funktionalitet bakom knapp
- Minimera cognitive load

### **Visual Hierarchy:**
- Röd = Hårt krav (viktigt!)
- Blå/Grön = Mjuk preferens
- Tydlig färgkodning genomgående

### **Feedback & Validation:**
- Live-uppdatering av "2/3 valda"
- Visuell bekräftelse på varje action
- Disabled states förhindrar felaktig input

---

## 📱 Responsiv Design

Dialog är responsiv och fungerar på:
- 💻 Desktop (max-width: 5xl)
- 📱 Tablet (scrollbar vid behov)
- 📱 Mobile (staplar kalender vertikalt)

---

## 🚀 Next Steps

1. ✅ Frontend implementation klar
2. ⏳ Uppdatera Gurobi för att respektera `hard_blocked_slots`
3. ⏳ Testa med riktiga användare
4. ⏳ Eventuellt: Notifikationer när blockerade pass närmar sig

---

**Implementerat av:** GitHub Copilot
**Datum:** 19 oktober 2025
**Status:** ✅ Redo för testning
