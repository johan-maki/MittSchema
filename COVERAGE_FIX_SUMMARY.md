# Fix: Täckningsberäkning och Passfördelning

## Problem som fixats

### 1. ❌ Felaktig täckningsberäkning (KRITISKT BUG)
**Symptom:** Systemet rapporterade 117.8% täckning trots att många pass inte var bemannade.

**Orsak:** 
- Täckningsberäkningen räknade bara antal **passtyper** (morgon, kväll, natt)
- Den tog INTE hänsyn till att varje pass behöver **flera personer**
- Formel (fel): `total_shifts = antal_dagar × antal_passtyper`
- Formel (rätt): `total_shifts = antal_dagar × antal_passtyper × personer_per_pass`

**Exempel:**
- November 2025: 30 dagar, 3 passtyper, 4 personer per pass
- **FEL beräkning:** 30 × 3 = 90 pass → 106/90 = 117.8% ✗
- **RÄTT beräkning:** 30 × 3 × 4 = 360 pass → 106/360 = 29.4% ✓

**Fix:**
```python
# scheduler-api/services/gurobi_optimizer_service.py (rad ~1355)
# FÖRE: coverage_stats["total_shifts"] = len(self.dates) * len(self.shift_types)
# EFTER:
coverage_stats["total_shifts"] = len(self.dates) * len(self.shift_types) * min_staff
```

### 2. ❌ Dålig passfördelning när "Ta hänsyn till kostnad" är AV
**Symptom:** Samma personer fick flera pass på samma dag, ojämn fördelning.

**Orsak:** 
- När kostnadsoptimering var avstängd (WORK_PERCENTAGE mode):
  - Ingen övre gräns för antal personer per pass (obegränsad överstaffing)
  - Låg vikt för rättvishet (10) jämfört med andra mål
  - Systemet maximerade totalt antal pass utan hänsyn till spridning

**Fix:**
1. **Begränsa överstaffing:**
```python
# scheduler-api/services/gurobi_optimizer_service.py (rad ~495-515)
# FÖRE: Ingen övre gräns när max_staff_per_shift inte var satt
# EFTER: Använd min_staff_per_shift som övre gräns för rättvis fördelning
```

2. **Öka vikter för rättvishet:**
```python
# scheduler-api/services/gurobi_optimizer_service.py (rad ~1245-1270)
# Objektivfunktion för WORK_PERCENTAGE mode:
# - total_unfairness: 10 → 70 (7x ökning!)
# - shift_type_unfairness: 8 → 40 (5x ökning!)
# - weekend_unfairness: 20 → 35 (1.75x ökning!)
```

### 3. ✅ Förbättrad UI-visualisering
**Fix:** UI använder nu backend-statistik när tillgänglig (mer korrekt än frontend-beräkning)

```typescript
// src/components/ui/ScheduleSummaryModal.tsx (rad ~155-200)
// Använd backend coverage_stats (räknar personer per pass)
// Fallback till frontend-beräkning om backend-data saknas
```

## Förväntade förändringar för användaren

### Täckningsrapportering
- **Före:** "117.8% täckning" - Felaktigt optimistiskt
- **Efter:** "29.4% täckning" - Korrekt, visar verkligt behov

### Passfördelning (när "Ta hänsyn till kostnad" är AV)
- **Före:** 
  - Samma personer fick många pass
  - Ojämn arbetsfördelning
  - Överstaffing på vissa pass
  
- **Efter:**
  - Jämnare fördelning mellan alla medarbetare
  - Max antal personer per pass begränsas
  - Högre prioritet på rättvis fördelning av pass och passtyper

## Tekniska detaljer

### Filer ändrade
1. `scheduler-api/services/gurobi_optimizer_service.py`
   - Rad ~102: Spara `min_staff_per_shift` för täckningsberäkning
   - Rad ~495-515: Fix överstaffing-kontroll
   - Rad ~1245-1270: Uppdaterad objektivfunktion
   - Rad ~1290: Lägg till `min_staff` variabel
   - Rad ~1355-1365: Fix täckningsberäkning

2. `src/components/ui/ScheduleSummaryModal.tsx`
   - Rad ~155-200: Använd backend coverage_stats som primär källa

### Backward compatibility
✅ Inga breaking changes - alla ändringar är bakåtkompatibla

## Testning

Kör testscript:
```bash
python3 test-coverage-calculation.py
```

Expected output visar skillnaden mellan gammal och ny beräkning.

## Sammanfattning

Två kritiska buggar fixade:
1. **Täckningsberäkning** - Nu korrekt rapporterad
2. **Passfördelning** - Nu jämn och rättvis när kostnad är avstängd

Användarupplevelsen förbättras genom:
- ✅ Korrekt täckningsinformation
- ✅ Bättre passfördelning
- ✅ Mer transparent rapportering
