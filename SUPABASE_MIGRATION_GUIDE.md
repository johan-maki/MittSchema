# Supabase Migration Guide: Experience Points System (1-5)

## Översikt
Detta dokument beskriver vilka ändringar som behöver göras i Supabase för att använda det nya erfarenhetspoäng-systemet (1-5) istället för det gamla årssystemet (0-10).

## 🔧 Nödvändiga ändringar

### 1. Databas-constraint uppdatering
Du behöver uppdatera constraints för `experience_level` kolumnen i `employees` tabellen.

#### SQL att köra i Supabase SQL Editor:

```sql
-- Ta bort gamla constraint (om det finns)
ALTER TABLE employees DROP CONSTRAINT IF EXISTS chk_experience_level;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_experience_level_check;

-- Lägg till ny constraint för 1-5 skala
ALTER TABLE employees 
ADD CONSTRAINT chk_experience_level 
CHECK (experience_level >= 1 AND experience_level <= 5);

-- Uppdatera eventuella NULL värden till 1
UPDATE employees 
SET experience_level = 1 
WHERE experience_level IS NULL;
```

### 2. Migrera befintlig data
Om du har befintliga medarbetare med erfarenhetsvärden utanför 1-5, kör migreringen:

#### Alternativ A: Använd migreringsscriptet
```bash
node run-experience-migration.mjs
```

#### Alternativ B: Manuell SQL-migrering
```sql
-- Konvertera befintliga värden enligt mappningstabellen
UPDATE employees 
SET experience_level = CASE 
    WHEN experience_level <= 0.5 THEN 1  -- 0-6 months -> 1 (Nybörjare)
    WHEN experience_level <= 1.5 THEN 2  -- 6-18 months -> 2 (Erfaren)
    WHEN experience_level <= 3 THEN 3    -- 1.5-3 years -> 3 (Välerfaren)
    WHEN experience_level >= 4 THEN 4    -- 3+ years -> 4 (Senior)
    ELSE 3  -- Default to 3 for edge cases
END
WHERE experience_level IS NOT NULL;
```

### 3. Verifiera migreringen
```sql
-- Kontrollera distribution av erfarenhetspoäng
SELECT 
    experience_level,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
FROM employees 
WHERE experience_level IS NOT NULL
GROUP BY experience_level 
ORDER BY experience_level;

-- Kontrollera att alla värden är inom 1-5
SELECT COUNT(*) as invalid_count
FROM employees 
WHERE experience_level < 1 OR experience_level > 5 OR experience_level IS NULL;
```

## 🗂️ Användbara scripts

### Kontrollera nuvarande status
```bash
node check-experience-levels.mjs
```

### Köra fullständig migrering
```bash
node run-experience-migration.mjs
```

## 📊 Ny poängskala
| Poäng | Nivå | Beskrivning | Typisk bakgrund |
|-------|------|-------------|-----------------|
| **1** | Nybörjare | Ny medarbetare som behöver handledning | 0-6 månader |
| **2** | Erfaren | Kan arbeta självständigt i grundläggande uppgifter | 6-18 månader |
| **3** | Välerfaren | Kompetent i de flesta situationer, kan handleda andra | 1,5-3 år |
| **4** | Senior | Hög kompetens, kan hantera komplexa situationer | 3+ år |
| **5** | Expert | Specialist med djup kunskap eller specialistutbildning | Specialist/Expert |

## ⚠️ Viktiga noteringar

1. **Backup först**: Gör alltid en backup av databasen innan du kör migreringar
2. **Testdata**: Alla framtida testdata kommer att genereras med 1-5 skalan
3. **Frontend-kompatibilitet**: Frontendet är redan uppdaterat för 1-5 skalan
4. **API-kompatibilitet**: Backend-API:et förväntar sig nu 1-5 värden

## 🔍 Felsökning

### Problem: Constraint-fel
```
ERROR: new row for relation "employees" violates check constraint "chk_experience_level"
```
**Lösning**: Kör migreringen först, sedan lägg till constraint:
```sql
-- Migrera data först
UPDATE employees SET experience_level = LEAST(GREATEST(experience_level, 1), 5);
-- Lägg sedan till constraint
ALTER TABLE employees ADD CONSTRAINT chk_experience_level CHECK (experience_level >= 1 AND experience_level <= 5);
```

### Problem: NULL-värden
```sql
UPDATE employees SET experience_level = 1 WHERE experience_level IS NULL;
```

### Problem: Decimaler
```sql
UPDATE employees SET experience_level = ROUND(experience_level) WHERE experience_level != ROUND(experience_level);
```

## 📝 Checklista

- [ ] Ta backup av databasen
- [ ] Kör `check-experience-levels.mjs` för att se nuvarande status  
- [ ] Kör `run-experience-migration.mjs` för att migrera data
- [ ] Lägg till ny constraint i Supabase SQL Editor
- [ ] Verifiera att alla värden är 1-5
- [ ] Testa att lägga till ny medarbetare i frontend
- [ ] Testa schemagenereringen med nya värden

## 🎯 Nästa steg efter migrering

1. Informera användarna om det nya poängsystemet
2. Använd `EXPERIENCE_POINTS_GUIDE.md` för att utbilda personal
3. Regelbunden genomgång av medarbetares poäng vid utvecklingssamtal
4. Anpassa schema-inställningar efter det nya systemet
