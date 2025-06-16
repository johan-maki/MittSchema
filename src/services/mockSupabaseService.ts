import { mockEmployees, mockShifts, mockScheduleSettings, createMockApiResponse, createMockApiError } from '@/utils/mockData';

class MockSupabaseService {
  private employees = [...mockEmployees];
  private shifts = [...mockShifts];
  private scheduleSettings = [...mockScheduleSettings];

  // Mock employees table operations
  async getEmployees() {
    console.log('📊 Mock: Fetching employees - total count:', this.employees.length);
    console.log('📊 Mock: Employee sample data:', this.employees[0]);
    const response = createMockApiResponse(this.employees);
    console.log('📊 Mock: Response structure:', response);
    return response;
  }

  async createEmployee(employee: any) {
    console.log('📊 Mock: Creating employee', employee.name);
    const newEmployee = {
      ...employee,
      id: `emp-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.employees.push(newEmployee);
    return createMockApiResponse(newEmployee);
  }

  async updateEmployee(id: string, updates: any) {
    console.log('📊 Mock: Updating employee', id);
    const index = this.employees.findIndex(emp => emp.id === id);
    if (index === -1) {
      return createMockApiError('Employee not found');
    }
    
    this.employees[index] = {
      ...this.employees[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    return createMockApiResponse(this.employees[index]);
  }

  async deleteEmployee(id: string) {
    console.log('📊 Mock: Deleting employee', id);
    const index = this.employees.findIndex(emp => emp.id === id);
    if (index === -1) {
      return createMockApiError('Employee not found');
    }
    
    const deleted = this.employees.splice(index, 1)[0];
    return createMockApiResponse(deleted);
  }

  // Mock shifts table operations
  async getShifts(filters?: any) {
    console.log('📊 Mock: Fetching shifts', filters);
    let filteredShifts = [...this.shifts];
    
    if (filters?.date) {
      filteredShifts = filteredShifts.filter(shift => shift.date === filters.date);
    }
    
    if (filters?.employee_id) {
      filteredShifts = filteredShifts.filter(shift => shift.employee_id === filters.employee_id);
    }
    
    return createMockApiResponse(filteredShifts);
  }

  async createShift(shift: any) {
    console.log('📊 Mock: Creating shift', shift);
    const newShift = {
      ...shift,
      id: shift.id || `shift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      status: 'Scheduled',
      is_published: false
    };
    this.shifts.push(newShift);
    console.log('📊 Mock: Shift created successfully, total shifts:', this.shifts.length);
    return createMockApiResponse(newShift);
  }

  async updateShift(id: string, updates: any) {
    console.log('📊 Mock: Updating shift', id);
    const index = this.shifts.findIndex(shift => shift.id === id);
    if (index === -1) {
      return createMockApiError('Shift not found');
    }
    
    this.shifts[index] = { ...this.shifts[index], ...updates };
    return createMockApiResponse(this.shifts[index]);
  }

  async deleteShift(id: string) {
    console.log('📊 Mock: Deleting shift', id);
    const index = this.shifts.findIndex(shift => shift.id === id);
    if (index === -1) {
      return createMockApiError('Shift not found');
    }
    
    const deleted = this.shifts.splice(index, 1)[0];
    return createMockApiResponse(deleted);
  }

  // Mock schedule settings operations
  async getScheduleSettings(department = 'General') {
    console.log('📊 Mock: Fetching schedule settings for department:', department);
    const settings = this.scheduleSettings.find(s => s.department === department);
    if (!settings) {
      console.log('📊 Mock: No settings found, returning default');
      return createMockApiResponse(null);
    }
    console.log('📊 Mock: Settings found:', settings);
    return createMockApiResponse(settings);
  }

  async createScheduleSettings(settings: any) {
    console.log('📊 Mock: Creating schedule settings', settings);
    const newSettings = {
      ...settings,
      id: `settings-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.scheduleSettings.push(newSettings);
    return createMockApiResponse(newSettings);
  }

  async updateScheduleSettings(id: string, updates: any) {
    console.log('📊 Mock: Updating schedule settings', id);
    const index = this.scheduleSettings.findIndex(s => s.id === id);
    if (index === -1) {
      return createMockApiError('Settings not found');
    }
    
    this.scheduleSettings[index] = {
      ...this.scheduleSettings[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    return createMockApiResponse(this.scheduleSettings[index]);
  }

  // Mock auth operations
  async signOut() {
    console.log('📊 Mock: Signing out');
    return createMockApiResponse({ success: true });
  }

  // Mock table builder for compatibility
  from(table: string) {
    const self = this;
    
    return {
      select: (columns?: string) => {
        console.log(`📊 Mock: SELECT ${columns || '*'} FROM ${table}`);
        
        const getData = () => {
          if (table === 'employees') {
            return self.getEmployees();
          }
          if (table === 'shifts') {
            return self.getShifts();
          }
          if (table === 'schedule_settings') {
            return self.getScheduleSettings();
          }
          return createMockApiResponse([]);
        };

        return {
          eq: (column: string, value: any) => {
            console.log(`📊 Mock: WHERE ${column} = ${value}`);
            const filteredPromise = getData().then(result => {
              if (result.data) {
                const filtered = result.data.filter((item: any) => item[column] === value);
                return { data: filtered, error: null };
              }
              return result;
            });
            
            // Return an object that supports .single()
            return {
              then: (callback: any) => filteredPromise.then(callback),
              single: () => {
                console.log(`📊 Mock: .single() called after .eq() for ${table}`);
                return filteredPromise.then(result => {
                  if (result.data && Array.isArray(result.data)) {
                    const firstItem = result.data[0];
                    if (!firstItem && table === 'schedule_settings') {
                      // Return error to trigger default settings fallback
                      return { data: null, error: { code: 'PGRST116', message: 'No settings found' } };
                    }
                    return { data: firstItem || null, error: null };
                  }
                  return result;
                });
              }
            };
          },
          order: (column: string, options?: any) => {
            console.log(`📊 Mock: ORDER BY ${column}`, options);
            return getData().then(result => {
              if (result.data) {
                const sorted = [...result.data].sort((a: any, b: any) => {
                  const aVal = a[column] || '';
                  const bVal = b[column] || '';
                  if (options?.ascending === false) {
                    return bVal.localeCompare(aVal);
                  }
                  return aVal.localeCompare(bVal);
                });
                return { data: sorted, error: null };
              }
              return result;
            });
          },
          single: () => {
            console.log(`📊 Mock: .single() called for ${table}`);
            return getData().then(result => {
              if (result.data && Array.isArray(result.data)) {
                // For schedule_settings, return the first item or default
                if (table === 'schedule_settings') {
                  const settings = result.data[0];
                  if (!settings) {
                    // Return error to trigger default settings fallback
                    return { data: null, error: { code: 'PGRST116', message: 'No settings found' } };
                  }
                  return { data: settings, error: null };
                }
                // For other tables, return first item
                return { data: result.data[0] || null, error: null };
              }
              return result;
            });
          },
          then: (callback: any) => {
            return getData().then(callback);
          }
        };
      },
      insert: (data: any) => ({
        select: () => {
          console.log(`📊 Mock: INSERT INTO ${table}`, Array.isArray(data) ? `${data.length} records` : 'single record');
          if (table === 'employees') {
            if (Array.isArray(data)) {
              const results = data.map(emp => self.createEmployee(emp));
              return Promise.all(results).then(responses => ({
                data: responses.map(r => r.data),
                error: null
              }));
            }
            return self.createEmployee(data);
          }
          if (table === 'shifts') {
            if (Array.isArray(data)) {
              const results = data.map(shift => {
                const newShift = {
                  ...shift,
                  id: shift.id || `shift-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  created_at: new Date().toISOString(),
                  is_published: shift.is_published || false
                };
                self.shifts.push(newShift);
                return newShift;
              });
              console.log(`📊 Mock: Bulk inserted ${results.length} shifts, total: ${self.shifts.length}`);
              return createMockApiResponse(results);
            }
            return self.createShift(data);
          }
          return createMockApiResponse(data);
        }
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: () => {
            console.log(`📊 Mock: UPDATE ${table} SET ... WHERE ${column} = ${value}`);
            if (table === 'employees') {
              return self.updateEmployee(value, data);
            }
            if (table === 'shifts') {
              return self.updateShift(value, data);
            }
            return createMockApiResponse(data);
          }
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => {
          console.log(`📊 Mock: DELETE FROM ${table} WHERE ${column} = ${value}`);
          if (table === 'employees') {
            return self.deleteEmployee(value);
          }
          if (table === 'shifts') {
            if (column === 'is_published' && value === false) {
              // Clear all unpublished shifts
              const beforeCount = self.shifts.length;
              self.shifts = self.shifts.filter(shift => shift.is_published === true);
              const deletedCount = beforeCount - self.shifts.length;
              console.log(`📊 Mock: Cleared ${deletedCount} unpublished shifts`);
              return createMockApiResponse({ success: true, deletedCount });
            }
            return self.deleteShift(value);
          }
          return createMockApiResponse({ success: true });
        }
      })
    };
  }
}

// Export singleton instance
export const mockSupabase = new MockSupabaseService();

// Mock auth object with complete API coverage
export const mockAuth = {
  signOut: () => {
    console.log('📊 Mock: signOut called');
    return Promise.resolve(createMockApiResponse({ success: true }));
  },
  
  getUser: () => {
    console.log('📊 Mock: getUser called');
    return Promise.resolve(createMockApiResponse({
      data: {
        user: {
          id: 'super-user-123',
          email: 'superuser@vardschema.se',
          user_metadata: { full_name: 'SuperUser Admin' },
          app_metadata: { role: 'admin' },
          aud: 'authenticated',
          created_at: new Date().toISOString()
        }
      }
    }));
  },
  
  getSession: () => {
    console.log('📊 Mock: getSession called');
    return Promise.resolve(createMockApiResponse({
      data: {
        session: {
          user: {
            id: 'super-user-123',
            email: 'superuser@vardschema.se',
            user_metadata: { full_name: 'SuperUser Admin', role: 'admin' },
            app_metadata: { role: 'admin' },
            aud: 'authenticated',
            created_at: new Date().toISOString()
          },
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer'
        }
      }
    }));
  },
  
  refreshSession: () => {
    console.log('📊 Mock: refreshSession called - preventing network call');
    return Promise.resolve(createMockApiResponse({
      data: {
        session: {
          user: {
            id: 'super-user-123',
            email: 'superuser@vardschema.se',
            user_metadata: { full_name: 'SuperUser Admin', role: 'admin' },
            app_metadata: { role: 'admin' },
            aud: 'authenticated',
            created_at: new Date().toISOString()
          },
          access_token: 'mock-access-token-refreshed',
          refresh_token: 'mock-refresh-token-refreshed',
          expires_in: 3600,
          token_type: 'bearer'
        }
      }
    }));
  },
  
  setSession: (session: any) => {
    console.log('📊 Mock: setSession called', session);
    return Promise.resolve(createMockApiResponse({ success: true }));
  },
  
  onAuthStateChange: (callback: any) => {
    console.log('📊 Mock: onAuthStateChange subscription created');
    // Immediately trigger callback with authenticated state
    setTimeout(() => {
      callback('SIGNED_IN', {
        user: {
          id: 'super-user-123',
          email: 'superuser@vardschema.se',
          user_metadata: { full_name: 'SuperUser Admin', role: 'admin' },
          app_metadata: { role: 'admin' },
          aud: 'authenticated',
          created_at: new Date().toISOString()
        },
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer'
      });
    }, 100);
    
    return {
      data: {
        subscription: {
          unsubscribe: () => console.log('📊 Mock: Auth subscription unsubscribed')
        }
      }
    };
  },
  
  // Add any other auth methods that might be called
  signInWithPassword: () => Promise.resolve(createMockApiResponse({ success: true })),
  signUp: () => Promise.resolve(createMockApiResponse({ success: true })),
  resetPasswordForEmail: () => Promise.resolve(createMockApiResponse({ success: true })),
  updateUser: () => Promise.resolve(createMockApiResponse({ success: true }))
};
