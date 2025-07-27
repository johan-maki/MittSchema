import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PreferencesModal from './PreferencesModal'

const PersonalView = () => {
  const [employees, setEmployees] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [showPreferences, setShowPreferences] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name')
      
      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const clearDatabase = async () => {
    if (!confirm('Är du säker på att du vill tömma hela databasen? Detta går inte att ångra.')) {
      return
    }
    
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .neq('id', 0)
      
      if (error) throw error
      await fetchEmployees()
    } catch (error) {
      console.error('Error clearing database:', error)
      alert('Fel vid tömning av databas')
    } finally {
      setIsLoading(false)
    }
  }

  const generateTestData = async (count) => {
    const names = [
      'Maria Johansson', 'Lars Larsson', 'Karin Karlsson', 
      'Anna Andersson', 'David Davidsson', 'Sofia Svensson',
      'Erik Eriksson', 'Emma Nilsson'
    ]
    
    const testEmployees = []
    for (let i = 0; i < count; i++) {
      testEmployees.push({
        name: names[i],
        phone: `+46 70 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}`,
        role: 'Sjuksköterska',
        department: 'Akutmottagning',
        experience_years: 1,
        salary: 1000,
        preferences: {
          shifts: ['morning', 'evening', 'night'],
          weekdays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          max_days_per_week: 5,
          hard_constraints: []
        }
      })
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('employees')
        .insert(testEmployees)
      
      if (error) throw error
      await fetchEmployees()
    } catch (error) {
      console.error('Error generating test data:', error)
      alert('Fel vid generering av testdata')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee)
    setShowPreferences(true)
  }

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getAvatarColor = (name) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500',
      'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ]
    const index = name.length % colors.length
    return colors[index]
  }

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div className="bg-blue-100 p-3 rounded-lg mr-4">
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Personalkatalog</h1>
            <p className="text-gray-600">Hantera och övervaka vårdpersonalen</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Personal</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded mr-3">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avdelningar</p>
                <p className="text-2xl font-bold">1</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-2 rounded mr-3">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Seniora Medarbetare</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Sök personal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option>Alla roller</option>
            <option>Sjuksköterska</option>
          </select>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={clearDatabase}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Tömmer...' : 'Töm databas'}
          </button>
          <button
            onClick={() => generateTestData(3)}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            Testdata (3)
          </button>
          <button
            onClick={() => generateTestData(5)}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            Testdata (5)
          </button>
          <button
            onClick={() => generateTestData(6)}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            Testdata (6)
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
            </svg>
            Lägg till personal
          </button>
        </div>
      </div>

      {/* Loading bar */}
      {isLoading && (
        <div className="mb-4">
          <div className="bg-blue-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
          </div>
        </div>
      )}

      {/* Employee Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avdelning</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Erfarenhet</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefon</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timlön</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEmployees.map((employee) => (
              <tr key={employee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm ${getAvatarColor(employee.name)}`}>
                      {getInitials(employee.name)}
                    </div>
                    <button
                      onClick={() => handleEmployeeClick(employee)}
                      className="ml-3 text-left hover:text-blue-600 focus:outline-none focus:text-blue-600"
                    >
                      <div className="text-sm font-medium text-gray-900 hover:underline">
                        {employee.name}
                      </div>
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {employee.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {employee.department}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                    {employee.experience_years} år
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {employee.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                  {employee.salary} SEK
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Preferences Modal */}
      {showPreferences && selectedEmployee && (
        <PreferencesModal
          employee={selectedEmployee}
          onClose={() => setShowPreferences(false)}
        />
      )}
    </div>
  )
}

export default PersonalView
