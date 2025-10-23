# Fix: Täckningsberäkning och Passfördelning över Passtyper

## Problem som identifierats

### 1. ❌ Felaktig täckningsberäkning (IGEN!)
**Symptom:** Systemet rapporterade "116 av 90 pass täckta" - vilket är omöjligt!

**Orsak:**
- `filled_shifts` räknade antal **person-tilldelningar** (106 personer × pass)
- `total_shifts` räknade antal **unika passplatser** (30 dagar × 3 passtyper = 90)
- Detta gav felaktig procent: 106/90 = 117.8% (men egentligen 30/90 = 33%)

**Exempel:**
- Om 4 personer jobbar samma morgonpass: räknades som 4 "filled_shifts"
- Men det är bara 1 unikt pass som täcks!

**Fix:**
```python
# scheduler-api/services/gurobi_optimizer_service.py
# Använd set() för att räkna unika passplatser:
filled_shift_slots = set()  # (date_index, shift_type) tuples
# ...
filled_shift_slots.add((d, shift))  # Räkna varje unikt pass en gång
```

### 2. ❌ Endast morgonpass läggs - inga kväll/natt-pass
**Symptom:** 
- Camilla & Amanda får ALLA morgonpass
- INGA kvällspass
- INGA nattpass
- Täckning ser OK ut men faktiskt bara 1/3 av passtyper används

**Orsak:**
- `allow_partial_coverage=True` i optimization_controller.py
- Detta gjorde min_staff_per_shift till en "soft constraint"
- Systemet kunde fylla work_percentage-mål med bara morgonpass
- Inga hårda krav på att fylla ALLA passtyper

**Fix:**

1. **Ändra default för allow_partial_coverage:**
```python
# scheduler-api/controllers/optimization_controller.py
# FÖRE: allow_partial_coverage=True  # Always True
# EFTER: allow_partial_coverage=request.allow_partial_coverage or False
```

2. **Lägg till balanserad passtypstäckning:**
```python
# scheduler-api/services/gurobi_optimizer_service.py
# Ny constraint: Varje passtyp (dag/kväll/natt) måste ha minst X person-shifts
# Detta förhindrar att alla shifts blir morgon
min_shifts_per_type = (len(self.dates) * min_staff_per_shift) // len(self.shift_types)
self.model.addConstr(shift_type_coverage >= min_shifts_per_type)
```

## Förväntade förändringar för användaren

### Täckningsrapportering
- **Före:** "116 av 90 pass täckta (117.8%)" - Matematiskt omöjligt!
- **Efter:** "30 av 90 unika passplatser täckta (33.3%)" - Korrekt

### Passfördelning över passtyper
- **Före:**
  - Dag: 100% täckt (alla Camilla & Amanda)
  - Kväll: 0% täckt
  - Natt: 0% täckt
  
- **Efter:**
  - Dag: ~33% täckt (jämnt fördelat)
  - Kväll: ~33% täckt (jämnt fördelat)
  - Natt: ~33% täckt (jämnt fördelat)

### Constraints enforcement
- **Före:** `allow_partial_coverage=True` → Soft constraints, systemet kan skippa pass
- **Efter:** `allow_partial_coverage=False` → Hard constraints, alla pass måste täckas

## Tekniska detaljer

### Filer ändrade
1. `scheduler-api/services/gurobi_optimizer_service.py`
   - Rad ~1293: Lägg till `filled_shift_slots = set()` för att räkna unika pass
   - Rad ~1350: Använd `filled_shift_slots.add((d, shift))` istället för `filled_shifts += 1`
   - Rad ~1360-1380: Beräkna täckning baserat på unika slots
   - Rad ~535-560: Lägg till balanserad passtypstäckning constraint

2. `scheduler-api/controllers/optimization_controller.py`
   - Rad ~99: Ändra `allow_partial_coverage` från `True` till request-baserat

### Backward compatibility
⚠️ **Breaking change**: Tidigare schemas kan se annorlunda ut eftersom constraints nu enforc:as

### Om systemet inte kan hitta en lösning

Om det inte finns tillräckligt med personal eller preferenser blockerar för många pass:

**Alternativ 1:** Användaren kan explicit sätta `allow_partial_coverage=True` i request
**Alternativ 2:** Systemet försöker med relaxed constraints (redan implementerat)

## Testning

### Test 1: Täckningsberäkning
```python
# 30 dagar, 3 passtyper, 1 person per pass
# 90 unika passplatser totalt
# Om 30 morgonpass fylls med 2 personer vardera = 60 person-shifts
# Tidigare: 60/90 = 66.7% (FEL - räknade personer)
# Nu: 30/90 = 33.3% (RÄTT - räknar unika pass)
```

### Test 2: Passtypsfördelning
```bash
# Kontrollera att schema har alla 3 passtyper:
# - Räkna morgonpass
# - Räkna kvällspass
# - Räkna nattpass
# Alla ska vara ungefär lika många
```

## Sammanfattning

Två kritiska buggar fixade:
1. **Täckningsberäkning** - Räknar nu unika passplatser, inte person-tilldelningar
2. **Passtypsfördelning** - Enforc:ar att alla passtyper (dag/kväll/natt) fylls balanserat

Användarupplevelsen förbättras genom:
- ✅ Korrekt täckningsinformation (inga omöjliga procent!)
- ✅ Balanserad fördelning över ALLA passtyper
- ✅ Hard constraints enforc:as (om inte allow_partial_coverage=True sätts explicit)
- ✅ Mer realistiskt schema som faktiskt täcker alla arbetstider
