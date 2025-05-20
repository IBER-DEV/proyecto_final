import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Contract } from '../types'; // Asegúrate de que tu tipo Contract solo incluya los campos de la tabla contracts
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore'; // Aunque no se usa directamente para permisos en la UI aquí, es buena práctica mantenerlo si hay lógica de permisos en otros lugares o RLS.
import {
  Calendar,
  DollarSign,
  Clock,
  Users,
  Percent,
  ChevronLeft,
  CheckCircle,
  XCircle,
} from 'lucide-react';

// Definimos un tipo auxiliar para la respuesta de Supabase con los JOINS.
// Extendemos el tipo base Contract y añadimos los perfiles relacionados.
// La estructura esperada es `{ full_name: string }` para cada perfil, o null si no se encuentra.
type ContractWithProfiles = Contract & {
  worker?: { full_name: string } | null;
  employer?: { full_name: string } | null;
};

export function ContractDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Obtenemos el usuario actual. Útil para futuras implementaciones de permisos
  // o para validar si el usuario actual es parte de este contrato.
  const { user } = useAuthStore(state => ({ user: state.user }));

  // El estado 'contract' ahora puede ser de tipo ContractWithProfiles,
  // o podemos mantenerlo como Contract y extraer solo los datos de contrato puro,
  // ya que los nombres se guardan en estados separados.
  // Mantendremos 'contract' como Contract para que sea consistente con el tipo original,
  // y extraeremos los nombres del objeto retornado por la query JOIN.
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workerName, setWorkerName] = useState<string>('');
  const [employerName, setEmployerName] = useState<string>('');

  useEffect(() => {
    // Función auxiliar para manejar tiempos de espera
    const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)); // Mensaje de timeout mejorado

    const fetchContract = async () => {
      console.log('useEffect triggered with id:', id);
      try {
        if (!id) {
          console.warn('No contract ID provided');
          setError('No contract ID provided');
          return;
        }

        console.log('Fetching contract with id and profiles:', id);

        // *** MEJORA: Combinar peticiones usando JOINs de Supabase ***
        // Seleccionamos todos los campos de 'contracts' (*)
        // y hacemos JOINs implícitos a la tabla 'profiles' usando las FK worker_id y employer_id.
        // Solo seleccionamos el campo 'full_name' de los perfiles relacionados.
        const contractPromise = supabase
          .from('contracts')
          .select('*, worker:profiles!worker_id(full_name), employer:profiles!employer_id(full_name)')
          .eq('id', id)
          .single(); // Esperamos un solo resultado

        // Aplicamos el timeout a la única petición combinada
        const { data: contractData, error: contractError } = await Promise.race([contractPromise, timeout(15000)]); // Aumentamos un poco el timeout al ser una petición más compleja

        if (contractError) {
          console.error('Contract fetch error:', contractError);
          throw new Error(`Error fetching contract: ${contractError.message}`);
        }
        if (!contractData) {
          console.error('Contract not found for id:', id);
          throw new Error('Contract not found');
        }

        console.log('Contract fetched with profiles:', contractData);

        // *** Extracción de nombres de los datos JOINED ***
        // contractData ahora tiene la estructura { ..., worker: { full_name: '...' } | null, employer: { full_name: '...' } | null }
        const fetchedContract = contractData as ContractWithProfiles; // Cast para acceder a los campos del join

        const workerNameTemp = fetchedContract.worker?.full_name || 'Unknown Worker';
        const employerNameTemp = fetchedContract.employer?.full_name || 'Unknown Employer';

        // *** Guardamos el contrato y los nombres por separado ***
        setContract(fetchedContract); // Guardamos el objeto completo, aunque el tipo 'Contract' puede no incluir los perfiles
        setWorkerName(workerNameTemp);
        setEmployerName(employerNameTemp);

        console.log('Set contract, workerName, and employerName');

      } catch (err: any) {
        console.error('Error in fetchContract:', err);
        // Mostrar un mensaje más amigable si el error es de timeout
        if (err.message && err.message.startsWith('Request timed out')) {
             setError(err.message + '. Please try again.');
        } else {
            setError(err.message || 'An unexpected error occurred');
        }
        setContract(null); // Asegurarse de que no haya datos parciales si hay un error
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    fetchContract();
  }, [id, user]); // Añadimos 'user' a las dependencias por si la lógica de autorización dependiera de él

  // --- Renderizado ---

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-500">Loading contract details...</p>
      </div>
    );
  }

  // Si hay un error O no se cargó el contrato (podría ser por no encontrado o no autorizado si se implementa la lógica de arriba)
  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-700">{error || 'Contract details could not be loaded.'}</p> {/* Mensaje de error más general */}
            <button
              onClick={() => navigate('/contracts')}
              className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Contracts
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay error y el contrato se cargó
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/contracts')}
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Contracts
          </button>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{contract.title}</h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">{contract.description}</p>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                  contract.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : contract.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : contract.status === 'completed'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-red-100 text-red-800' // Assuming 'cancelled' or other states are handled by red
                }`}
              >
                {contract.status ? contract.status.charAt(0).toUpperCase() + contract.status.slice(1) : 'Unknown'}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Users className="mr-1.5 h-4 w-4 text-gray-400" />
                  Employer
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{employerName}</dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Users className="mr-1.5 h-4 w-4 text-gray-400" />
                  Worker
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{workerName}</dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Calendar className="mr-1.5 h-4 w-4 text-gray-400" />
                  Start Date
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date(contract.start_date).toLocaleDateString()}</dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Calendar className="mr-1.5 h-4 w-4 text-gray-400" />
                  End Date
                </dt>
                {/* Asegurarse de que contract.end_date no sea null o undefined antes de llamar a new Date */}
                <dd className="mt-1 text-sm text-gray-900">
                  {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'No end date'}
                </dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <DollarSign className="mr-1.5 h-4 w-4 text-gray-400" />
                  Salary
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  ${contract.salary.toLocaleString()}/{contract.payment_frequency}
                </dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Clock className="mr-1.5 h-4 w-4 text-gray-400" />
                  Hours per Week
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{contract.hours_per_week}</dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Percent className="mr-1.5 h-4 w-4 text-gray-400" />
                  risk_level 
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{(contract.risk_level )}</dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Clock className="mr-1.5 h-4 w-4 text-gray-400" />
                  overtime_rate_diurnal 
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{(contract.overtime_rate_diurnal )}</dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Clock className="mr-1.5 h-4 w-4 text-gray-400" />
                  overtime_rate_nocturnal 
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{(contract.overtime_rate_nocturnal )}</dd>
              </div>
            </dl>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contract Status</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center">
                {contract.signed_by_employer ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                )}
                <span className="text-sm text-gray-700">Signed by Employer: {employerName}</span>
              </div>
              <div className="flex items-center">
                {contract.signed_by_worker ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                )}
                <span className="text-sm text-gray-700">Signed by Worker: {workerName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}