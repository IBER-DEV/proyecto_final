import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Contract, ContractStatus } from '../types';
import { supabase } from '../lib/supabase';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ContractStatusActions } from '../components/StatusManager';
import { ContractStatusManager } from '../lib/statusManager';

// Esquema de validación con Zod actualizado
const contractFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().nonempty('Description is required'),
  worker_email: z.string().email('Invalid email address'),
  start_date: z.string().nonempty('Start date is required'),
  end_date: z.string().optional(),
  salary: z.number().min(1300000, 'Salary must be at least the minimum wage (1,300,000 COP)'), // Ajustado al SMLMV 2024
  payment_frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  hours_per_week: z.number().min(1).max(48, 'Hours per week must be between 1 and 48'), // Jornada máxima legal
  overtime_rate_diurnal: z.number().min(1.25, 'Daytime overtime rate must be at least 1.25'), // Mínimo legal Colombia
  overtime_rate_nocturnal: z.number().min(1.75, 'Nighttime overtime rate must be at least 1.75'), // Mínimo legal Colombia
  risk_level: z.number().min(1).max(5, 'Risk level must be between 1 and 5'), // Para ARL
});

type ContractFormData = z.infer<typeof contractFormSchema>;

function ContractForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: ContractFormData) => void;
  onCancel: () => void;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      title: '',
      description: '',
      worker_email: '',
      start_date: '',
      salary: 1300000, // SMLMV 2024 como valor por defecto
      payment_frequency: 'monthly',
      hours_per_week: 40,
      overtime_rate_diurnal: 1.25, // Mínimo legal diurno
      overtime_rate_nocturnal: 1.75, // Mínimo legal nocturno
      risk_level: 1, // Nivel de riesgo mínimo por defecto
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Contract Details</h3>
            <p className="mt-1 text-sm text-gray-500">
              Please fill in the details for the new contract.
            </p>
          </div>
          <div className="mt-5 md:col-span-2 md:mt-0 space-y-6">
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6 sm:col-span-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  {...register('title')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.title && <p className="text-red-600 text-sm">{errors.title.message}</p>}
              </div>

              <div className="col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  {...register('description')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.description && <p className="text-red-600 text-sm">{errors.description.message}</p>}
              </div>

              <div className="col-span-6 sm:col-span-4">
                <label htmlFor="worker_email" className="block text-sm font-medium text-gray-700">
                  Worker Email
                </label>
                <input
                  type="email"
                  id="worker_email"
                  {...register('worker_email')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.worker_email && <p className="text-red-600 text-sm">{errors.worker_email.message}</p>}
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  id="start_date"
                  {...register('start_date')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.start_date && <p className="text-red-600 text-sm">{errors.start_date.message}</p>}
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  id="end_date"
                  {...register('end_date')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="salary" className="block text-sm font-medium text-gray-700">
                  Salary (COP)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="salary"
                    {...register('salary', { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm pl-7"
                    placeholder="1300000"
                  />
                </div>
                {errors.salary && <p className="text-red-600 text-sm">{errors.salary.message}</p>}
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="payment_frequency" className="block text-sm font-medium text-gray-700">
                  Payment Frequency
                </label>
                <select
                  id="payment_frequency"
                  {...register('payment_frequency')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                {errors.payment_frequency && <p className="text-red-600 text-sm">{errors.payment_frequency.message}</p>}
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="hours_per_week" className="block text-sm font-medium text-gray-700">
                  Hours per Week
                </label>
                <input
                  type="number"
                  id="hours_per_week"
                  {...register('hours_per_week', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.hours_per_week && <p className="text-red-600 text-sm">{errors.hours_per_week.message}</p>}
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="overtime_rate_diurnal" className="block text-sm font-medium text-gray-700">
                  Overtime Rate (Daytime, multiplier)
                </label>
                <input
                  type="number"
                  id="overtime_rate_diurnal"
                  {...register('overtime_rate_diurnal', { valueAsNumber: true })}
                  step="0.01" // Ajustado para mayor precisión
                  min="1.25" // Mínimo legal
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.overtime_rate_diurnal && <p className="text-red-600 text-sm">{errors.overtime_rate_diurnal.message}</p>}
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="overtime_rate_nocturnal" className="block text-sm font-medium text-gray-700">
                  Overtime Rate (Nighttime, multiplier)
                </label>
                <input
                  type="number"
                  id="overtime_rate_nocturnal"
                  {...register('overtime_rate_nocturnal', { valueAsNumber: true })}
                  step="0.01" // Ajustado para mayor precisión
                  min="1.75" // Mínimo legal
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.overtime_rate_nocturnal && <p className="text-red-600 text-sm">{errors.overtime_rate_nocturnal.message}</p>}
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="risk_level" className="block text-sm font-medium text-gray-700">
                  Risk Level (1-5 for ARL)
                </label>
                <input
                  type="number"
                  id="risk_level"
                  {...register('risk_level', { valueAsNumber: true })}
                  step="1"
                  min="1"
                  max="5"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.risk_level && <p className="text-red-600 text-sm">{errors.risk_level.message}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Create Contract
        </button>
      </div>
    </form>
  );
}

function ContractList({
  contracts,
  onStatusUpdate,
}: {
  contracts: Contract[];
  onStatusUpdate: (contract: Contract, newStatus: ContractStatus) => Promise<void>;
}) {
  const { user } = useAuthStore();

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {contracts.map((contract) => (
          <li key={contract.id}>
            <div className="block hover:bg-gray-50">
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium text-blue-600">
                    {contract.title}
                  </p>
                  <div className="ml-2 flex flex-shrink-0">
                    <ContractStatusActions
                      contract={contract}
                      userRole={user?.role || 'worker'}
                      onStatusUpdate={(newStatus: string) =>
                        onStatusUpdate(contract, newStatus as ContractStatus)
                      }
                    />
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      ${contract.salary.toLocaleString()} /{' '}
                      {contract.payment_frequency}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>
                      Started{' '}
                      {new Date(contract.start_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Contracts() {
  const { user } = useAuthStore();
  const isEmployer = user?.role === 'employer';
  const [showForm, setShowForm] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);

  // Efecto para filtrar contratos según el término de búsqueda
  useEffect(() => {
    const filtered = contracts.filter((contract) =>
      contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contract.description && contract.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredContracts(filtered);
  }, [searchTerm, contracts]);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        if (profileError) throw profileError;

        const query = supabase.from('contracts').select('*');
        if (isEmployer) {
          query.eq('employer_id', profile.id);
        } else {
          query.eq('worker_id', profile.id);
        }

        const { data, error: contractsError } = await query;
        if (contractsError) throw contractsError;
        setContracts(data || []);
        setFilteredContracts(data || []);  // Inicializar también los contratos filtrados
      } catch (err) {
        console.error('Error fetching contracts:', err);
        setError('Failed to load contracts');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchContracts();
    }
  }, [user, isEmployer]);

  const handleCreateContract = async (data: ContractFormData) => {
    try {
      setError(null);

      const { data: employerProfile, error: employerError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (employerError) throw employerError;

      const { data: workerProfile, error: workerError } = await supabase
        .from('auth_user_emails')
        .select('profile_id, role')
        .eq('email', data.worker_email)
        .maybeSingle();

      if (workerError) throw workerError;

      if (!workerProfile) {
        throw new Error(
          'Worker not found. Please make sure the email is correct and the worker has registered.'
        );
      }

      if (workerProfile.role !== 'worker') {
        throw new Error(
          'The specified email belongs to an employer account. Please enter a worker email address.'
        );
      }

      const { data: newContract, error: contractError } = await supabase
        .from('contracts')
        .insert([
          {
            employer_id: employerProfile?.id || null,
            worker_id: workerProfile.profile_id,
            title: data.title,
            description: data.description,
            start_date: data.start_date,
            end_date: data.end_date || null,
            salary: data.salary,
            payment_frequency: data.payment_frequency,
            status: 'pending',
            hours_per_week: data.hours_per_week,
            overtime_rate_diurnal: data.overtime_rate_diurnal, // Nuevo campo
            overtime_rate_nocturnal: data.overtime_rate_nocturnal, // Nuevo campo
            risk_level: data.risk_level, // Nuevo campo
          },
        ])
        .select()
        .single();

      if (contractError) throw contractError;

      setContracts([...contracts, newContract]);
      setFilteredContracts([...filteredContracts, newContract]);  // Actualizar también los contratos filtrados
      setShowForm(false);
    } catch (err: any) {
      console.error('Error creating contract:', err);
      setError(err.message || 'Failed to create contract');
    }
  };

  const handleStatusUpdate = async (
    contract: Contract,
    newStatus: ContractStatus
  ) => {
    try {
      setError(null);
      const updatedContract = await ContractStatusManager.updateStatus(
        contract,
        newStatus
      );

      const updatedContracts = contracts.map((c) => 
        c.id === contract.id ? updatedContract : c
      );
      setContracts(updatedContracts);
      
      // Actualizar también los contratos filtrados
      setFilteredContracts(filteredContracts.map((c) => 
        c.id === contract.id ? updatedContract : c
      ));
    } catch (err: any) {
      console.error('Error updating contract status:', err);
      setError(err.message || 'Failed to update contract status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Contracts
          </h2>
        </div>
        {isEmployer && !showForm && (
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              New Contract
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {showForm ? (
        <ContractForm
          onSubmit={handleCreateContract}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <>
          <div className="flex space-x-4">
            <div className="flex-1 min-w-0">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Search contracts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Filter className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
              Filters
            </button>
          </div>

          {filteredContracts.length > 0 ? (
            <ContractList
              contracts={filteredContracts}
              onStatusUpdate={handleStatusUpdate}
            />
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No contracts</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 
                  "No contracts match your search criteria." : 
                  (isEmployer
                    ? "You haven't created any contracts yet."
                    : "You haven't received any contracts yet.")}
              </p>
              {isEmployer && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    New Contract
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}