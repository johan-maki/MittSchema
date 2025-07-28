# Staffing och Erfarenhetskrav - Användarguide för Chefer

## Översikt
Du kan nu ställa in två viktiga kriterier när du genererar scheman:

1. **Minimum antal personer per pass** - Hur många personer som måste jobba varje pass
2. **Minimum erfarenhetspoäng per pass** - Hur mycket erfarenhet som krävs totalt per pass

## 1. Minimum Antal Personer Per Pass

### Vad det gör:
- Säkerställer att varje pass har exakt det antal personer du anger
- Systemet kommer att schema exakt detta antal (inte mer, inte mindre)

### Exempel:
- **Värde: 1** = Varje pass kommer ha 1 person
- **Värde: 2** = Varje pass kommer ha 2 personer  
- **Värde: 3** = Varje pass kommer ha 3 personer

### När använda:
- Sjukhus som kräver minst 2 sjuksköterskor per pass
- Kliniker som behöver 1 läkare per pass
- Avdelningar med säkerhetskrav på bemanning

## 2. Minimum Erfarenhetspoäng Per Pass

### Vad det gör:
- Säkerställer att den totala erfarenheten per pass når din minimumgräns
- Systemet summerar alla medarbetares erfarenhetspoäng som jobbar samma pass

### Hur det räknas:
Varje medarbetare har en erfarenhetsnivå (1-5 poäng vanligtvis):
- **Junior medarbetare**: 1 poäng
- **Erfaren medarbetare**: 2-3 poäng  
- **Senior medarbetare**: 4-5 poäng

### Exempel:
**Krav: 4 erfarenhetspoäng per pass**

✅ **Godkända kombinationer:**
- 1 senior (4 poäng) + 1 junior (1 poäng) = 5 poäng totalt
- 2 erfarna (2+2 poäng) = 4 poäng totalt
- 4 juniorer (1+1+1+1 poäng) = 4 poäng totalt (men kräver 4 personer per pass)

❌ **Ej godkända:**
- 2 juniorer (1+1 poäng) = 2 poäng totalt (för lågt)
- 1 junior (1 poäng) = 1 poäng totalt (för lågt)

### När använda:
- Sjukhus som kräver att minst 1 senior finns per pass (sätt krav på 4+ poäng)
- Avdelningar som behöver viss kompetensnivå
- Säkerställa att inte bara juniorer jobbar samtidigt

## 3. Kombinerade Krav

### Exempel: Sjukhus med 2 personer per pass och 4 erfarenhetspoäng

**Systemet kommer hitta lösningar som:**
- 1 senior (4 poäng) + 1 junior (1 poäng) = 2 personer, 5 poäng ✅
- 2 erfarna (2+2 poäng) = 2 personer, 4 poäng ✅
- 1 erfaren (3 poäng) + 1 junior (1 poäng) = 2 personer, 4 poäng ✅

**Systemet kommer INTE acceptera:**
- 2 juniorer (1+1 poäng) = 2 personer, 2 poäng ❌ (för låg erfarenhet)
- 1 senior (4 poäng) = 1 person, 4 poäng ❌ (för få personer)

## 4. Felsökning

### "Ingen lösning hittades"
Detta kan bero på:

1. **För höga krav**: Du kräver mer erfarenhet än dina medarbetare kan leverera
   - *Lösning*: Sänk erfarenhetskravet eller anställ mer erfaren personal

2. **För många personer krävs**: Du har inte tillräckligt med personal
   - *Lösning*: Sänk personalkravet eller öka arbetstiderna för befintlig personal

3. **Kombination omöjlig**: Dina krav kan inte uppfyllas tillsammans
   - *Lösning*: Aktivera "Tillåt ofullständig täckning" för att få bästa möjliga schema

### Tips för bra inställningar:
- **Börja lågt**: Testa med låga krav först (1 person, 1 erfarenhetspoäng)
- **Öka gradvis**: Höj kraven tills du får den kvalitet du vill ha  
- **Kontrollera personal**: Se till att dina medarbetares erfarenhetsnivåer är korrekt inställda

## 5. Erfarenhetsnivåer - Rekommendationer

### Förslag på poängsystem:
- **1 poäng**: Ny medarbetare (0-6 månader)
- **2 poäng**: Erfaren (6-24 månader)
- **3 poäng**: Välerfaren (2-4 år)
- **4 poäng**: Senior (4+ år)
- **5 poäng**: Expert/specialist (8+ år eller specialistutbildning)

### Justera i systemet:
1. Gå till medarbetarhantering
2. Redigera varje medarbetares profil
3. Sätt "Erfarenhetsnivå" till rätt värde (1-5)
4. Spara ändringarna

Nu är systemet redo att använda båda kriterierna för att skapa optimala scheman! 🎯
