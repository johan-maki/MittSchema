const PreferencesModal = ({ employee, onClose }) => {
  const shiftLabels = {
    morning: 'Morgon',
    evening: 'Kväll', 
    night: 'Natt'
  }

  const weekdayLabels = {
    monday: 'Måndag',
    tuesday: 'Tisdag',
    wednesday: 'Onsdag',
    thursday: 'Torsdag',
    friday: 'Fredag',
    saturday: 'Lördag',
    sunday: 'Söndag'
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

  const isHardConstraint = (type, value) => {
    return employee.preferences?.hard_constraints?.some(
      constraint => constraint.type === type && constraint.value === value
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${getAvatarColor(employee.name)} ring-4 ring-white ring-opacity-30`}>
                {getInitials(employee.name)}
              </div>
              <div className="ml-4 text-white">
                <h2 className="text-2xl font-bold">{employee.name}</h2>
                <p className="text-blue-100">{employee.role} • {employee.department}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Max Days */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 7h12v9a1 1 0 01-1 1H5a1 1 0 01-1-1V7z" />
              </svg>
              Arbetstid per vecka
            </h3>
            <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
              <div className="text-center">
                <span className="text-3xl font-bold text-blue-600">
                  {employee.preferences?.max_days_per_week || 0}
                </span>
                <span className="text-lg text-gray-600 ml-1">dagar/vecka</span>
              </div>
            </div>
          </div>

          {/* Available Shifts */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Tillgängliga pass
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(shiftLabels).map(([shift, label]) => {
                const isAvailable = employee.preferences?.shifts?.includes(shift)
                const isHard = isHardConstraint('shift', shift)
                return (
                  <div
                    key={shift}
                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                      isAvailable
                        ? isHard
                          ? 'bg-green-100 border-green-500 shadow-md'
                          : 'bg-green-50 border-green-300'
                        : 'bg-gray-100 border-gray-200 opacity-50'
                    }`}
                  >
                    <div className={`text-sm font-medium ${
                      isAvailable ? 'text-green-800' : 'text-gray-500'
                    }`}>
                      {label}
                    </div>
                    {isHard && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-200 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Måste
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Available Weekdays */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-5 h-5 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 7h12v9a1 1 0 01-1 1H5a1 1 0 01-1-1V7z" />
              </svg>
              Tillgängliga veckodagar
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {Object.entries(weekdayLabels).map(([day, label]) => {
                const isAvailable = employee.preferences?.weekdays?.includes(day)
                const isHard = isHardConstraint('weekday', day)
                return (
                  <div
                    key={day}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      isAvailable
                        ? isHard
                          ? 'bg-purple-100 border-purple-500 shadow-md'
                          : 'bg-purple-50 border-purple-300'
                        : 'bg-gray-100 border-gray-200 opacity-50'
                    }`}
                  >
                    <div className={`text-xs font-medium ${
                      isAvailable ? 'text-purple-800' : 'text-gray-500'
                    }`}>
                      {label.substring(0, 3)}
                    </div>
                    {isHard && (
                      <div className="mt-1">
                        <svg className="w-3 h-3 mx-auto text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Förklaring:</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded mr-2"></div>
                <span className="text-gray-700">Tillgänglig</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded mr-2"></div>
                <span className="text-gray-700">Hårt krav (måste)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-100 border-2 border-gray-200 rounded mr-2 opacity-50"></div>
                <span className="text-gray-700">Ej tillgänglig</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreferencesModal
