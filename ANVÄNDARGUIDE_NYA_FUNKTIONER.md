# Användarguide - Nya Schemafunktioner

## Översikt

Tre nya kraftfulla funktioner har lagts till i schemasystemet:

1. 🎯 **Gantt-vy** - Tidslinje-visualisering av scheman
2. ✏️ **Chef-redigeringsläge** - Klicka för att redigera scheman direkt
3. 🤖 **AI-begränsningar** - Skriv krav med vanligt språk

---

## 1. Gantt-vy 📊

### Så här använder du Gantt-vyn

1. Gå till **Schema**-sidan
2. Klicka på **"Gantt"**-knappen i sidhuvudet
3. Se alla arbetspass i en tidslinje

### Färgkodning
- 🟢 **Grön** = Dagpass (06:00-14:00)
- 🟠 **Orange** = Kvällspass (14:00-22:00)  
- 🔵 **Blå** = Nattpass (22:00-06:00)

### Tips
- Scrolla horisontellt för att se alla datum
- Varje rad visar en anställd
- Perfekt för att få överblick över längre perioder

---

## 2. Chef-redigeringsläge ✏️

### Starta redigeringsläge

1. Gå till **Schema**-sidan
2. Klicka på **"Redigera"**-knappen
3. Klicka på valfri ruta för att ändra skifttyp

### Redigera arbetspass

**Klicka på en ruta** för att växla mellan:
```
Dag → Kväll → Natt → Ledig → (tillbaka till Dag)
```

### Validering ⚠️

Systemet kontrollerar automatiskt:
- ✅ Max 5 arbetsdagar per vecka
- ✅ Inga pass på blockerade datum
- ✅ Respekterar strikta dag-preferenser
- ✅ Respekterar strikta skifttyp-preferenser
- ✅ Minst 1 person per pass (vardagar)
- ✅ Minst 1 erfaren per pass (nivå ≥3)

**Om valideringen misslyckas:**
- Röd varningsruta visas längst upp
- Detaljerade felmeddelanden listas
- "Spara"-knappen är inaktiverad

### Spara ändringar

1. Gör dina ändringar i rutnätet
2. Kontrollera att inga valideringsfel visas
3. Klicka på **"Spara ändringar"**
4. Bekräftelse visas när det är klart

**OBS:** Ändringar sparas direkt till databasen!

### Återställ ändringar

Klicka på **"Återställ"** för att ångra alla osparade ändringar.

---

## 3. AI-begränsningar 🤖

### Lägg till krav med naturligt språk

**Skriv helt enkelt vad du vill** i textfältet:

#### Exempel på krav:

```
Anna ska inte jobba natt 15 november
```

```
Erik måste ha ledigt lördag 23:e
```

```
Sara vill helst inte jobba kväll nästa måndag
```

### Stödda formuleringar

#### Anställda
- Förnamn: "Anna", "Erik", "Sara"
- Fullständigt namn: "Anna Andersson"

#### Datum
- Specifikt datum: "15 november", "23:e"
- Datumintervall: "15-17 november"

#### Skifttyper
- "dag" eller "dagskift"
- "kväll" eller "kvällspass"
- "natt" eller "nattskift"

#### Hårdhet
**Hårda krav** (MÅSTE följas):
- "ska inte"
- "kan inte"
- "måste"
- "får inte"

**Mjuka krav** (FÖREDRAR att följa):
- "vill inte"
- "föredrar inte"
- "helst inte"

### Förstå tolkningarna

Varje tillagt krav visar:

**Säkerhetsnivå:**
- 🟢 **Hög säkerhet** - Allt identifierat korrekt
- 🟡 **Medel säkerhet** - Viss osäkerhet
- 🔴 **Låg säkerhet** - Saknar viktig information

**Typ av krav:**
- 🔴 **Blockerat pass** - Kan inte jobba specifikt pass
- 🔵 **Skiftpreferens** - Föredrar vissa skift
- 🟣 **Erfarenhetskrav** - Behöver viss erfarenhet

**Hårdhet:**
- 🔒 **Hårt krav** - Schemat MÅSTE följa detta
- 💭 **Mjukt krav** - Schemat försöker följa detta

### Ta bort krav

Klicka på **papperskorgen** 🗑️ bredvid ett krav för att ta bort det.

### Använda krav vid schemagenering

1. Lägg till dina krav via AI-fältet
2. Gå till **"Generera schema"**
3. Nya schemat kommer respektera alla krav

**Bakom kulisserna:**
- Hårda krav läggs till som absoluta begränsningar i optimeringen
- Mjuka krav påverkar poängberäkningen (kommer snart)

---

## Vanliga användningsfall

### Situation 1: Anställd behöver ledigt
```
"Anna ska inte jobba 15-17 november"
```

### Situation 2: Inga nattpass för viss person
```
"Erik kan inte jobba natt"
```

### Situation 3: Föredrar inte helger
```
"Sara vill helst inte jobba lördag 23:e"
```

### Situation 4: Måste ha erfaren personal
```
"Vi behöver minst en erfaren per nattpass"
```
*(Denna formulering är inte fullt stödd än, men systemet validerar automatiskt erfarenhet)*

---

## Felsökning

### Problem: "Ingen täckning för dagpass 15 nov"
**Lösning:** Lägg till fler anställda för det datumet eller justera staffing-krav

### Problem: "Anna har 6 arbetspass vecka 15 nov"
**Lösning:** Ta bort ett av passen eller fördela till annan anställd

### Problem: "Ingen erfaren personal för nattpass 20 nov"
**Lösning:** Tilldela minst en anställd med erfarenhetsnivå ≥3 till det passet

### Problem: AI-kravet får låg säkerhet
**Lösning:** Kontrollera att:
- Namnet stämmer med en anställd i systemet
- Datumet är i rätt format
- Skifttypen är "dag", "kväll" eller "natt"

---

## Keyboard Shortcuts (Framtida feature)

Planerade kortkommandon:
- `Ctrl/Cmd + S` - Spara ändringar
- `Ctrl/Cmd + Z` - Ångra
- `Ctrl/Cmd + Y` - Gör om
- `Esc` - Avbryt redigering

---

## Support

Vid problem eller frågor:
1. Kontrollera att du har senaste versionen
2. Titta på valideringsmeddelanden för ledtrådar
3. Kontakta systemadministratör

---

**Senast uppdaterad:** 2025-10-19  
**Version:** 1.0.0
