import React, { useState } from 'react';
import { Plus, MapPin, Users, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabaseClient';
import { Button } from '@/components/ui/button';
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete';

interface Customer {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  notes?: string;
}

const fetchCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase.from('customers').select('*');
  if (error) throw error;
  return data || [];
};

const addCustomer = async (customer: Omit<Customer, 'id'>) => {
  const { data, error } = await supabase.from('customers').insert([customer]).select();
  if (error) throw error;
  return data?.[0];
};

const addTestCustomers = async (count: number) => {
  // Stockholm test addresses
  const addresses = [
    'Sveavägen 10, Stockholm',
    'Kungsgatan 50, Stockholm',
    'Götgatan 78, Stockholm',
    'Valhallavägen 100, Stockholm',
    'Hornsgatan 60, Stockholm',
    'Odengatan 65, Stockholm',
    'Fleminggatan 20, Stockholm',
    'Sankt Eriksgatan 30, Stockholm',
    'Birger Jarlsgatan 18, Stockholm',
    'Lidingövägen 115, Stockholm'
  ];
  const testCustomers = Array.from({ length: count }).map((_, i) => ({
    name: `Testkund ${i + 1}`,
    address: addresses[i % addresses.length],
    phone: `070-123 45 6${i}`,
    email: `testkund${i + 1}@example.com`,
    notes: 'Testdata för slingplanering'
  }));
  const { data, error } = await supabase.from('customers').insert(testCustomers).select();
  if (error) throw error;
  return data;
};

export default function CustomerDirectory() {
  const queryClient = useQueryClient();
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers
  });

  const mutation = useMutation({
    mutationFn: addCustomer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] })
  });

  const testMutation = useMutation({
    mutationFn: addTestCustomers,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] })
  });

  const [newCustomer, setNewCustomer] = useState<Omit<Customer, 'id'>>({
    name: '',
    address: '',
    phone: '',
    email: '',
    notes: ''
  });

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Users className="w-6 h-6 text-blue-500" /> Kundkatalog
      </h1>
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Lägg till kund</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Namn</label>
            <input
              type="text"
              value={newCustomer.name}
              onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Kundnamn"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adress</label>
            <AddressAutocomplete
              value={newCustomer.address}
              onChange={value => setNewCustomer({ ...newCustomer, address: value })}
              onAddressSelect={(address, latitude, longitude) => setNewCustomer({ ...newCustomer, address, latitude, longitude })}
              placeholder="Kundadress"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="text"
              value={newCustomer.phone}
              onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Telefonnummer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-post</label>
            <input
              type="email"
              value={newCustomer.email}
              onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="E-postadress"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Anteckningar</label>
          <textarea
            value={newCustomer.notes}
            onChange={e => setNewCustomer({ ...newCustomer, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Anteckningar om kunden"
            rows={2}
          />
        </div>
        <Button
          onClick={() => mutation.mutate(newCustomer)}
          disabled={mutation.isPending || !newCustomer.name || !newCustomer.address}
        >
          <Plus className="w-4 h-4 mr-1" /> Lägg till kund
        </Button>
        {mutation.isPending && <Loader2 className="ml-2 w-4 h-4 animate-spin text-blue-500 inline" />}
      </div>
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Testdata</h2>
        <div className="flex gap-2">
          <Button onClick={() => testMutation.mutate(3)} disabled={testMutation.isPending}>Lägg till 3 testkunder</Button>
          <Button onClick={() => testMutation.mutate(5)} disabled={testMutation.isPending}>Lägg till 5 testkunder</Button>
          <Button onClick={() => testMutation.mutate(10)} disabled={testMutation.isPending}>Lägg till 10 testkunder</Button>
          {testMutation.isPending && <Loader2 className="ml-2 w-4 h-4 animate-spin text-blue-500 inline" />}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Kunder</h2>
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Namn</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Adress</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Telefon</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">E-post</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Anteckningar</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{customer.name}</td>
                  <td className="px-4 py-2 text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" /> {customer.address}
                  </td>
                  <td className="px-4 py-2 text-gray-700">{customer.phone}</td>
                  <td className="px-4 py-2 text-gray-700">{customer.email}</td>
                  <td className="px-4 py-2 text-gray-700">{customer.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
