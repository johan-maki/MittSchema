=== ÄNDRA ANDREAS ROLL I SUPABASE DASHBOARD ===

🌐 **Via Supabase Dashboard (rekommenderat):**

1. **Öppna Supabase Dashboard:**
   - Gå till: https://supabase.com/dashboard
   - Logga in på ditt konto

2. **Navigera till ditt projekt:**
   - Välj projektet "kjgmsayrnrlwzixlozsg" (MittSchema)

3. **Öppna Table Editor:**
   - Klicka på "Table Editor" i vänstermenyn
   - Välj tabellen "employees"

4. **Hitta Andreas:**
   - Använd sökfunktionen eller scrolla för att hitta "Andreas Lundquist"
   - Han borde ha role = "Läkare"

5. **Ändra rollen:**
   - Klicka på "role"-cellen för Andreas
   - Ändra från "Läkare" till "Sjuksköterska"
   - Tryck Enter eller klicka Save

6. **Verifiera ändringen:**
   - Kontrollera att Andreas nu har role = "Sjuksköterska"

🧪 **Testa teorin:**

7. **Generera nytt schema:**
   - Gå till din MittSchema-app
   - Klicka "Generera schema (nästa månad)"
   - Kontrollera om Andreas nu får pass

8. **Resultat:**
   - ✅ Om Andreas får pass = rolle-problemet bekräftat!
   - ❌ Om Andreas fortfarande får 0 pass = andra orsaker

🔄 **Återställ efter testet:**

9. **Återställ Andreas roll:**
   - Gå tillbaka till Supabase Dashboard
   - Ändra Andreas role tillbaka till "Läkare"
   - Detta för att inte störa det riktiga systemet

📊 **Alternativ metod via SQL Editor:**

Om Table Editor inte fungerar:
1. Gå till "SQL Editor" i Supabase Dashboard
2. Kör denna query för att ändra:
   ```sql
   UPDATE employees 
   SET role = 'Sjuksköterska' 
   WHERE name ILIKE '%andreas%';
   ```
3. Efter testet, återställ med:
   ```sql
   UPDATE employees 
   SET role = 'Läkare' 
   WHERE name ILIKE '%andreas%';
   ```

🎯 **Varför detta test är viktigt:**

Detta test kommer bevisa om problemet ligger i:
- ✅ Gurobi backend role-baserade constraints
- ❌ Andra faktorer (constraints, tillgänglighet, etc.)

Om Andreas får pass som "Sjuksköterska" men inte som "Läkare", 
då vet vi att Gurobi backend har specialregler för läkare.
