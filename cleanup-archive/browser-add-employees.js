// Add this to browser console to create test employees
async function addTestEmployees() {
  // Import the addProfile function if available globally, or use fetch
  const testEmployees = [
    { first_name: 'Anna', last_name: 'Andersson', role: 'Läkare', department: 'General', experience_level: 4 },
    { first_name: 'Bengt', last_name: 'Bengtsson', role: 'Sjuksköterska', department: 'General', experience_level: 3 },
    { first_name: 'Cecilia', last_name: 'Carlsson', role: 'Undersköterska', department: 'General', experience_level: 2 },
    { first_name: 'David', last_name: 'Davidsson', role: 'Läkare', department: 'General', experience_level: 5 },
    { first_name: 'Emma', last_name: 'Eriksson', role: 'Sjuksköterska', department: 'General', experience_level: 4 }
  ];

  for (const emp of testEmployees) {
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emp)
      });
      
      if (response.ok) {
        console.log(`✅ Added ${emp.first_name} ${emp.last_name}`);
      } else {
        console.log(`❌ Failed to add ${emp.first_name} ${emp.last_name}`);
      }
    } catch (error) {
      console.log(`❌ Error adding ${emp.first_name} ${emp.last_name}:`, error);
    }
  }
}

// Call the function
addTestEmployees();
