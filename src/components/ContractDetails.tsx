import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Contract } from '../types';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  Users, 
  Percent,
  ChevronLeft,
  CheckCircle,
  XCircle
} from 'lucide-react';

export function ContractDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workerName, setWorkerName] = useState<string>('');
  const [employerName, setEmployerName] = useState<string>('');

  useEffect(() => {
    const fetchContract = async () => {
      try {
        if (!id) return;

        const { data: contractData, error: contractError } = await supabase
          .from('contracts')
          .select('*')
          .eq('id', id)
          .single();

        if (contractError) throw contractError;
        if (!contractData) throw new Error('Contract not found');

        setContract(contractData);

        // Fetch worker and employer names
        const { data: workerProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', contractData.worker_id)
          .single();

        const { data: employerProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', contractData.employer_id)
          .single();

        if (workerProfile) setWorkerName(workerProfile.full_name);
        if (employerProfile) setEmployerName(employerProfile.full_name);

      } catch (err: any) {
        console.error('Error fetching contract:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-700">{error || 'Contract not found'}</p>
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
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                contract.status === 'active' ? 'bg-green-100 text-green-800' :
                contract.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                contract.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>
                {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
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
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(contract.start_date).toLocaleDateString()}
                </dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Calendar className="mr-1.5 h-4 w-4 text-gray-400" />
                  End Date
                </dt>
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
                  Tax Rate
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{(contract.tax_rate * 100).toFixed(1)}%</dd>
              </div>

              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Percent className="mr-1.5 h-4 w-4 text-gray-400" />
                  Social Security Rate
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {(contract.social_security_rate * 100).toFixed(1)}%
                </dd>
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
                <span className="text-sm text-gray-700">
                  Signed by Employer: {employerName}
                </span>
              </div>
              <div className="flex items-center">
                {contract.signed_by_worker ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                )}
                <span className="text-sm text-gray-700">
                  Signed by Worker: {workerName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}