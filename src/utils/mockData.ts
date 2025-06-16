// Mock data for development testing
export const mockEmployees = [
  {
    id: 'emp-001',
    first_name: 'Anna',
    last_name: 'Andersson',
    email: 'anna.andersson@vardschema.se',
    role: 'Sjuksköterska',
    department: 'Akuten',
    experience_level: 3,
    phone: '070-123-4567',
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z',
    work_preferences: {
      preferred_shifts: ['day', 'evening'],
      max_shifts_per_week: 5,
      available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }
  },
  {
    id: 'emp-002',
    first_name: 'Erik',
    last_name: 'Eriksson',
    email: 'erik.eriksson@vardschema.se',
    role: 'Undersköterska',
    department: 'Medicin',
    experience_level: 2,
    phone: '070-234-5678',
    created_at: '2024-01-16T08:00:00Z',
    updated_at: '2024-01-16T08:00:00Z',
    work_preferences: {
      preferred_shifts: ['day'],
      max_shifts_per_week: 4,
      available_days: ['monday', 'tuesday', 'wednesday', 'friday', 'saturday', 'sunday']
    }
  },
  {
    id: 'emp-003',
    first_name: 'Maria',
    last_name: 'Svensson',
    email: 'maria.svensson@vardschema.se',
    role: 'Specialistsjuksköterska',
    department: 'Intensivvård',
    experience_level: 5,
    phone: '070-345-6789',
    created_at: '2024-01-17T08:00:00Z',
    updated_at: '2024-01-17T08:00:00Z',
    work_preferences: {
      preferred_shifts: ['day', 'evening', 'night'],
      max_shifts_per_week: 6,
      available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    }
  },
  {
    id: 'emp-004',
    first_name: 'Johan',
    last_name: 'Nilsson',
    email: 'johan.nilsson@vardschema.se',
    role: 'Läkare',
    department: 'Kirurgi',
    experience_level: 4,
    phone: '070-456-7890',
    created_at: '2024-01-18T08:00:00Z',
    updated_at: '2024-01-18T08:00:00Z',
    work_preferences: {
      preferred_shifts: ['day'],
      max_shifts_per_week: 5,
      available_days: ['monday', 'tuesday', 'thursday', 'friday', 'saturday']
    }
  },
  {
    id: 'emp-005',
    first_name: 'Sara',
    last_name: 'Karlsson',
    email: 'sara.karlsson@vardschema.se',
    role: 'Undersköterska',
    department: 'Geriatrik',
    experience_level: 3,
    phone: '070-567-8901',
    created_at: '2024-01-19T08:00:00Z',
    updated_at: '2024-01-19T08:00:00Z',
    work_preferences: {
      preferred_shifts: ['evening'],
      max_shifts_per_week: 3,
      available_days: ['monday', 'tuesday', 'friday', 'saturday', 'sunday']
    }
  },
  {
    id: 'emp-006',
    first_name: 'Peter',
    last_name: 'Johansson',
    email: 'peter.johansson@vardschema.se',
    role: 'Sjuksköterska',
    department: 'Ortopedi',
    experience_level: 3,
    phone: '070-678-9012',
    created_at: '2024-01-20T08:00:00Z',
    updated_at: '2024-01-20T08:00:00Z',
    work_preferences: {
      preferred_shifts: ['night'],
      max_shifts_per_week: 4,
      available_days: ['monday', 'tuesday', 'wednesday', 'saturday', 'sunday']
    }
  },
  {
    id: 'emp-007',
    first_name: 'Lisa',
    last_name: 'Bergström',
    email: 'lisa.bergstrom@vardschema.se',
    role: 'Barnsjuksköterska',
    department: 'Pediatrik',
    experience_level: 4,
    phone: '070-789-0123',
    created_at: '2024-01-21T08:00:00Z',
    updated_at: '2024-01-21T08:00:00Z',
    work_preferences: {
      preferred_shifts: ['day', 'evening'],
      max_shifts_per_week: 5,
      available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }
  },
  {
    id: 'emp-008',
    first_name: 'Magnus',
    last_name: 'Lindberg',
    email: 'magnus.lindberg@vardschema.se',
    role: 'Anestesisjuksköterska',
    department: 'Operation',
    experience_level: 5,
    phone: '070-890-1234',
    created_at: '2024-01-22T08:00:00Z',
    updated_at: '2024-01-22T08:00:00Z',
    work_preferences: {
      preferred_shifts: ['day'],
      max_shifts_per_week: 5,
      available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }
  }
];

export const mockShifts = [
  {
    id: 'shift-001',
    employee_id: 'emp-001',
    employee_name: 'Anna Andersson',
    date: '2024-06-17',
    start_time: '07:00',
    end_time: '15:00',
    shift_type: 'Day',
    department: 'Akuten',
    status: 'Scheduled',
    created_at: '2024-06-15T08:00:00Z'
  },
  {
    id: 'shift-002',
    employee_id: 'emp-002',
    employee_name: 'Erik Eriksson',
    date: '2024-06-17',
    start_time: '08:00',
    end_time: '16:00',
    shift_type: 'Day',
    department: 'Medicin',
    status: 'Scheduled',
    created_at: '2024-06-15T08:00:00Z'
  },
  {
    id: 'shift-003',
    employee_id: 'emp-003',
    employee_name: 'Maria Svensson',
    date: '2024-06-17',
    start_time: '15:00',
    end_time: '23:00',
    shift_type: 'Evening',
    department: 'Intensivvård',
    status: 'Scheduled',
    created_at: '2024-06-15T08:00:00Z'
  },
  {
    id: 'shift-004',
    employee_id: 'emp-006',
    employee_name: 'Peter Johansson',
    date: '2024-06-17',
    start_time: '22:00',
    end_time: '06:00',
    shift_type: 'Night',
    department: 'Ortopedi',
    status: 'Scheduled',
    created_at: '2024-06-15T08:00:00Z'
  },
  {
    id: 'shift-005',
    employee_id: 'emp-004',
    employee_name: 'Johan Nilsson',
    date: '2024-06-18',
    start_time: '07:00',
    end_time: '15:00',
    shift_type: 'Day',
    department: 'Kirurgi',
    status: 'Scheduled',
    created_at: '2024-06-15T08:00:00Z'
  },
  {
    id: 'shift-006',
    employee_id: 'emp-005',
    employee_name: 'Sara Karlsson',
    date: '2024-06-18',
    start_time: '14:00',
    end_time: '22:00',
    shift_type: 'Evening',
    department: 'Geriatrik',
    status: 'Scheduled',
    created_at: '2024-06-15T08:00:00Z'
  }
];

// Mock schedule settings
export const mockScheduleSettings = [
  {
    id: 'settings-001',
    department: 'General',
    max_consecutive_days: 5,
    min_rest_hours: 11,
    min_weekly_rest_hours: 36,
    morning_shift: {
      min_staff: 3,
      min_experience_sum: 6
    },
    afternoon_shift: {
      min_staff: 3,
      min_experience_sum: 6
    },
    night_shift: {
      min_staff: 2,
      min_experience_sum: 4
    },
    created_at: '2024-01-01T08:00:00Z',
    updated_at: '2024-01-01T08:00:00Z'
  }
];

export const mockDepartments = [
  'Akuten',
  'Medicin',
  'Intensivvård',
  'Kirurgi',
  'Geriatrik',
  'Ortopedi',
  'Kardiologi',
  'Onkologi'
];

export const mockRoles = [
  'Läkare',
  'Specialistsjuksköterska',
  'Sjuksköterska',
  'Undersköterska',
  'Vårdbiträde'
];

export const mockCompetencyLevels = [
  'Junior',
  'Intermediate', 
  'Senior',
  'Expert'
];

export const mockSkills = [
  'Akutsjukvård',
  'Triagering',
  'Medicin',
  'Handledning',
  'Grundläggande vård',
  'Patienthantering',
  'Hygien',
  'Intensivvård',
  'Ventilatorvård',
  'Avancerad medicin',
  'Forskning',
  'Utbildning',
  'Kirurgi',
  'Laparoskopi',
  'Traumavård',
  'Äldreomsorg',
  'Demenshantering',
  'Ortopedisk vård',
  'Postoperativ vård',
  'Smärthantering'
];

// Mock API responses
export const createMockApiResponse = <T>(data: T, delay = 300): Promise<{ data: T; error: null }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data, error: null });
    }, delay);
  });
};

export const createMockApiError = (message: string, delay = 300): Promise<{ data: null; error: { message: string } }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: null, error: { message } });
    }, delay);
  });
};
