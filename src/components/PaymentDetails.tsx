import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Asegúrate de que tus tipos Contract y Payment existan y sean correctos
import { Payment, Contract } from '../types';
import { supabase } from '../lib/supabase';
// Aunque no se usa directamente para permisos en la UI aquí, es buena práctica mantenerlo si hay lógica de permisos en otros lugares o RLS.
import { useAuthStore } from '../store/authStore';

import {
  Calendar,
  DollarSign,
  Clock,
  Users,
  ChevronLeft,
  CheckCircle,
  XCircle,
  ClipboardList, // Icono para contrato
  Tag, // Icono para método de pago
} from 'lucide-react';

// Definimos un tipo auxiliar para la respuesta de Supabase con los JOINS.
// Partimos del tipo Payment y añadimos el objeto 'contract' anidado.
// El objeto 'contract' contendrá algunos campos de Contract y, dentro de él,
// los perfiles del worker y employer (con solo full_name).
type FetchedPaymentDetails = Payment & {
  contract: {
    id: string;
    title: string;
    description?: string | null; // Puede ser opcional
    start_date: string;
    end_date?: string | null; // Puede ser opcional/null
    worker?: { full_name: string } | null;
    employer?: { full_name: string } | null;
  } | null; // El contrato podría ser null si la FK es NULL o el contrato no existe (menos probable)
};

export function PaymentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Obtenemos el usuario actual. Útil para futuras implementaciones de permisos.
  const { user } = useAuthStore(state => ({ user: state.user }));

  // Estado para almacenar todos los datos fetcheados (pago + contrato + nombres)
  const [details, setDetails] = useState<FetchedPaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para los nombres, extraídos de los detalles fetcheados
  const [workerName, setWorkerName] = useState<string>('');
  const [employerName, setEmployerName] = useState<string>('');

  useEffect(() => {
    const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms));

    const fetchPaymentDetails = async () => {
      console.log('useEffect triggered for PaymentDetails with id:', id);
      try {
        if (!id) {
          console.warn('No payment ID provided');
          setError('No payment ID provided');
          return;
        }

        console.log('Fetching payment with id and related contract/profiles:', id);

        // *** MEJORA: Combinar peticiones usando JOINs de Supabase ***
        // Seleccionamos todos los campos de 'payments' (*)
        // Hacemos JOIN implícito a la tabla 'contracts' usando la FK contract_id.
        // Dentro del JOIN a contracts, hacemos *otros* JOINs implícitos a 'profiles'
        // usando las FK worker_id y employer_id de la tabla contracts.
        // Solo seleccionamos los campos que necesitamos de cada tabla.
        const paymentPromise = supabase
        .from('payments')
        .select(`
          *,
          contract:contracts!contract_id (
            id,
            title,
            description,
            start_date,
            end_date,
            worker:profiles!worker_id (
              full_name
            ),
            employer:profiles!employer_id (
              full_name
            )
          )
        `) // ¡Comentarios removidos de aquí!
        .eq('id', id)
        .single();
        // Aplicamos el timeout
        const { data: paymentData, error: paymentError } = await Promise.race([paymentPromise, timeout(15000)]);

        if (paymentError) {
          console.error('Payment fetch error:', paymentError);
          throw new Error(`Error fetching payment: ${paymentError.message}`);
        }
        if (!paymentData) {
          console.error('Payment not found for id:', id);
          throw new Error('Payment not found');
        }

        console.log('Payment details fetched:', paymentData);

        // *** Extracción de nombres y detalles del contrato de los datos JOINED ***
        const fetchedDetails = paymentData as FetchedPaymentDetails; // Cast para acceder a los campos anidados

        // Guardamos todos los detalles fetcheados en el estado principal
        setDetails(fetchedDetails);

        // Extraemos nombres usando optional chaining
        const workerNameTemp = fetchedDetails.contract?.worker?.full_name || 'Unknown Worker';
        const employerNameTemp = fetchedDetails.contract?.employer?.full_name || 'Unknown Employer';

        // Guardamos los nombres por separado para fácil acceso en el renderizado
        setWorkerName(workerNameTemp);
        setEmployerName(employerNameTemp);

        console.log('Set payment details, workerName, and employerName');

      } catch (err: any) {
        console.error('Error in fetchPaymentDetails:', err);
        // Mostrar un mensaje más amigable si el error es de timeout
        if (err.message && err.message.startsWith('Request timed out')) {
             setError(err.message + '. Please try again.');
        } else {
            setError(err.message || 'An unexpected error occurred');
        }
        setDetails(null); // Asegurarse de que no haya datos parciales si hay un error
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [id, user]); // Añadimos 'user' por si la lógica de autorización dependiera de él

  // --- Renderizado ---

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-500">Loading payment details...</p>
      </div>
    );
  }

  // Si hay un error O no se cargaron los detalles
  if (error || !details) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-700">{error || 'Payment details could not be loaded.'}</p>
            <button
              onClick={() => navigate('/payments')} // Asegúrate de tener una ruta para listar pagos
              className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Payments
            </button>
          </div>
        </div>
      </div>
    );
  }

    // Accedemos al contrato y al pago desde el estado `details`
    const payment = details; // 'details' ya contiene los campos del pago base
    const contract = details.contract; // 'details.contract' contiene los campos del contrato y perfiles anidados

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/payments')} // Asegúrate de que esta ruta sea correcta
            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Payments
          </button>
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-2xl font-bold text-gray-900">Payment Details</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Information about this payment.</p>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">

              {/* Sección de Detalles del Pago */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <DollarSign className="mr-1.5 h-4 w-4 text-gray-400" />
                    Amount
                </dt>
                <dd className="mt-1 text-sm text-gray-900">${payment.amount?.toLocaleString() || 'N/A'}</dd> {/* Usar optional chaining por si acaso */}
              </div>

               <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Tag className="mr-1.5 h-4 w-4 text-gray-400" />
                    Payment Method
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{payment.payment_method || 'N/A'}</dd>
              </div>

               <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="mr-1.5 h-4 w-4 text-gray-400" />
                    Payment Date
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                    {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}
                </dd>
              </div>

               <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                    {payment.status === 'completed' ? (
                      <CheckCircle className="mr-1.5 h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="mr-1.5 h-4 w-4 text-red-500" />
                    )}
                    Status
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {payment.status ? payment.status.charAt(0).toUpperCase() + payment.status.slice(1) : 'Unknown'}
                </dd>
              </div>

              {/* Sección de Detalles del Contrato Asociado */}
               <div className="sm:col-span-2 mt-4"> {/* Ocupa dos columnas */}
                 <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4 flex items-center">
                    <ClipboardList className="mr-2 h-5 w-5 text-gray-600" />
                    Associated Contract Details
                 </h4>
               </div>

              {contract ? (
                <>
                    <div className="sm:col-span-2"> {/* Título y descripción pueden ocupar 2 columnas */}
                        <dt className="text-sm font-medium text-gray-500">Contract Title</dt>
                        <dd className="mt-1 text-sm text-gray-900">{contract.title || 'Untitled Contract'}</dd>
                        {contract.description && (
                            <>
                                <dt className="mt-4 text-sm font-medium text-gray-500">Description</dt>
                                <dd className="mt-1 text-sm text-gray-900">{contract.description}</dd>
                            </>
                        )}
                     </div>

                     <div className="sm:col-span-1">
                       <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <Users className="mr-1.5 h-4 w-4 text-gray-400" />
                          Employer
                       </dt>
                       <dd className="mt-1 text-sm text-gray-900">{employerName}</dd> {/* Usamos el estado */}
                     </div>

                      <div className="sm:col-span-1">
                       <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <Users className="mr-1.5 h-4 w-4 text-gray-400" />
                          Worker
                       </dt>
                       <dd className="mt-1 text-sm text-gray-900">{workerName}</dd> {/* Usamos el estado */}
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
                         {/* Asegurarse de que contract.end_date no sea null o undefined */}
                         <dd className="mt-1 text-sm text-gray-900">
                            {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'No end date'}
                         </dd>
                      </div>

                       <div className="sm:col-span-2"> {/* Link to contract details */}
                            <dt className="text-sm font-medium text-gray-500">More Contract Info</dt>
                            <dd className="mt-1 text-sm text-blue-600 hover:text-blue-500 cursor-pointer"
                                onClick={() => navigate(`/contracts/${contract.id}`)}>
                                View Contract Details
                            </dd>
                       </div>
                </>
              ) : (
                <div className="sm:col-span-2 text-sm text-gray-500">No associated contract details available.</div>
              )}

            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}