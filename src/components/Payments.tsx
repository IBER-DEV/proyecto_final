import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  ArrowRight,
  DollarSign,
  Clock,
  Calculator,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Payment, Contract, PaymentStatus } from '../types';
import { supabase } from '../lib/supabase';
import { PaymentStatusActions } from '../components/StatusManager';
import { PaymentStatusManager } from '../lib/statusManager';

interface PaymentFormData {
  contract_id: string;
  payment_date: string;
  payment_method: 'bank_transfer' | 'digital_wallet';
  hours_worked: number;
  overtime_hours_diurnal: number; // Nuevo
  overtime_hours_nocturnal: number; // Nuevo
}

interface PaymentCalculation {
  base_salary: number;
  overtime_pay: number;
  gross_amount: number;
  tax_deductions: number;
  social_security_deductions: number;
  employer_contributions: number; // Nuevo
  net_amount: number;
}

function calculatePayment(
  contract: Contract,
  hours: number,
  overtimeHoursDiurnal: number,
  overtimeHoursNocturnal: number
): PaymentCalculation {
  const hourlyRate =
    contract.salary /
    (contract.payment_frequency === 'monthly'
      ? 160
      : contract.payment_frequency === 'biweekly'
      ? 80
      : 40);
  const minHourlyRate = 1300000 / 240; // SMLMV 2024
  const adjustedHourlyRate = Math.max(hourlyRate, minHourlyRate);

  const base_salary = adjustedHourlyRate * hours;
  const overtimePayDiurnal = adjustedHourlyRate * (contract.overtime_rate_diurnal || 1.25) * overtimeHoursDiurnal;
  const overtimePayNocturnal = adjustedHourlyRate * (contract.overtime_rate_nocturnal || 1.75) * overtimeHoursNocturnal;
  const overtime_pay = overtimePayDiurnal + overtimePayNocturnal;
  const gross_amount = base_salary + overtime_pay;

  const ibc = Math.max(gross_amount, 1300000); // IBC mínimo
  const healthEmployee = ibc * 0.04;
  const pensionEmployee = ibc * 0.04;
  const social_security_deductions = healthEmployee + pensionEmployee;

  const tax_deductions = calculateTaxDeductions(gross_amount);

  const healthEmployer = ibc * 0.085;
  const pensionEmployer = ibc * 0.12;
  const arlEmployer = ibc * getArlRate(contract.risk_level || 1); // Usar risk_level
  const employer_contributions = healthEmployer + pensionEmployer + arlEmployer;

  const net_amount = gross_amount - tax_deductions - social_security_deductions;

  return {
    base_salary,
    overtime_pay,
    gross_amount,
    tax_deductions,
    social_security_deductions,
    employer_contributions,
    net_amount,
  };
}

// Función auxiliar para retención en la fuente (simplificada)
function calculateTaxDeductions(grossAmount: number): number {
  const uvtValue = 47065; // 2024, ajusta para 2025
  const incomeInUvt = grossAmount / uvtValue;
  if (incomeInUvt < 95) return 0;
  if (incomeInUvt < 150) return (grossAmount - 95 * uvtValue) * 0.19;
  return 0; // Completa con más tramos si es necesario
}

// Función auxiliar para tasa de ARL según nivel de riesgo
function getArlRate(riskLevel: number): number {
  const arlRates = [0.00522, 0.01044, 0.02436, 0.04350, 0.06960]; // Niveles 1-5
  return arlRates[riskLevel - 1] || 0.00522; // Default a nivel 1
}

function PaymentSummary({ calculation }: { calculation: PaymentCalculation }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg mt-4">
      <h4 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h4>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Base Salary:</span>
          <span className="font-medium">${calculation.base_salary.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Overtime Pay:</span>
          <span className="font-medium">${calculation.overtime_pay.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-medium border-t border-gray-200 pt-2">
          <span>Gross Amount:</span>
          <span>${calculation.gross_amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-red-600">
          <span>Tax Deductions:</span>
          <span>-${calculation.tax_deductions.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-red-600">
          <span>Social Security:</span>
          <span>-${calculation.social_security_deductions.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Employer Contributions:</span>
          <span>${calculation.employer_contributions.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
          <span>Net Amount:</span>
          <span>${calculation.net_amount.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function PaymentForm({
  onSubmit,
  onCancel,
  contracts,
}: {
  onSubmit: (data: PaymentFormData, calculation: PaymentCalculation) => void;
  onCancel: () => void;
  contracts: Contract[];
}) {
  const [formData, setFormData] = useState<PaymentFormData>({
    contract_id: '',
    payment_date: '',
    payment_method: 'bank_transfer',
    hours_worked: 0,
    overtime_hours_diurnal: 0, // Nuevo
    overtime_hours_nocturnal: 0, // Nuevo
  });

  const selectedContract = contracts.find((c) => c.id === formData.contract_id);
  const calculation = useMemo(() => {
    return selectedContract
      ? calculatePayment(
          selectedContract,
          formData.hours_worked,
          formData.overtime_hours_diurnal,
          formData.overtime_hours_nocturnal
        )
      : null;
  }, [selectedContract, formData.hours_worked, formData.overtime_hours_diurnal, formData.overtime_hours_nocturnal]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (calculation) {
          onSubmit(formData, calculation);
        }
      }}
      className="space-y-6"
    >
      <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Payment Details</h3>
            <p className="mt-1 text-sm text-gray-500">
              Please fill in the payment details and hours worked.
            </p>
          </div>
          <div className="mt-5 md:col-span-2 md:mt-0 space-y-6">
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6 sm:col-span-4">
                <label htmlFor="contract_id" className="block text-sm font-medium text-gray-700">
                  Contract
                </label>
                <select
                  id="contract_id"
                  name="contract_id"
                  value={formData.contract_id}
                  onChange={(e) => setFormData({ ...formData, contract_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Select a contract</option>
                  {contracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.title} - ${contract.salary}/{contract.payment_frequency}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700">
                  Payment Date
                </label>
                <input
                  type="date"
                  name="payment_date"
                  id="payment_date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700">
                  Payment Method
                </label>
                <select
                  id="payment_method"
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_method: e.target.value as any })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="digital_wallet">Digital Wallet</option>
                </select>
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="hours_worked" className="block text-sm font-medium text-gray-700">
                  Hours Worked
                </label>
                <input
                  type="number"
                  name="hours_worked"
                  id="hours_worked"
                  value={formData.hours_worked}
                  onChange={(e) =>
                    setFormData({ ...formData, hours_worked: Number(e.target.value) })
                  }
                  min="0"
                  step="0.5"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="overtime_hours_diurnal" className="block text-sm font-medium text-gray-700">
                  Overtime Hours (Daytime)
                </label>
                <input
                  type="number"
                  name="overtime_hours_diurnal"
                  id="overtime_hours_diurnal"
                  value={formData.overtime_hours_diurnal}
                  onChange={(e) =>
                    setFormData({ ...formData, overtime_hours_diurnal: Number(e.target.value) })
                  }
                  min="0"
                  step="0.5"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="overtime_hours_nocturnal" className="block text-sm font-medium text-gray-700">
                  Overtime Hours (Nighttime)
                </label>
                <input
                  type="number"
                  name="overtime_hours_nocturnal"
                  id="overtime_hours_nocturnal"
                  value={formData.overtime_hours_nocturnal}
                  onChange={(e) =>
                    setFormData({ ...formData, overtime_hours_nocturnal: Number(e.target.value) })
                  }
                  min="0"
                  step="0.5"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {calculation && <PaymentSummary calculation={calculation} />}
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
          disabled={!calculation}
        >
          Create Payment
        </button>
      </div>
    </form>
  );
}

function PaymentList({
  payments,
  onStatusUpdate,
}: {
  payments: Payment[];
  onStatusUpdate: (payment: Payment, newStatus: PaymentStatus) => Promise<void>;
}) {
  const { user } = useAuthStore();
  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {payments.map((payment) => (
          <li key={payment.id}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <p className="truncate text-sm font-medium text-blue-600">
                    Payment #{payment.id.slice(0, 8)}
                  </p>
                  <ArrowRight className="mx-2 h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    Contract #{payment.contract_id.slice(0, 8)}
                  </p>
                </div>
                <div className="ml-2 flex flex-shrink-0">
                  <PaymentStatusActions
                    payment={payment}
                    userRole={user?.role || 'worker'}
                    onStatusUpdate={(newStatus: string) =>
                      onStatusUpdate(payment, newStatus as PaymentStatus)
                    }
                  />
                </div>
              </div>
              <div className="mt-2 sm:flex sm:justify-between">
                <div className="sm:flex space-x-6">
                  <p className="flex items-center text-sm text-gray-500">
                    <DollarSign className="mr-1.5 h-4 w-4 text-gray-400" />$
                    {payment.amount.toLocaleString()}
                  </p>
                  <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <Calculator className="mr-1.5 h-4 w-4 text-gray-400" />
                    Net: ${payment.net_amount.toLocaleString()}
                  </p>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                  <Clock className="mr-1.5 h-4 w-4 text-gray-400" />
                  <p>Due {new Date(payment.payment_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Payments() {
  const { user } = useAuthStore();
  const isEmployer = user?.role === 'employer';
  const [showForm, setShowForm] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const filtered = payments.filter((payment) =>
      payment.contract_id.toLowerCase().includes(searchTerm.toLowerCase())
      || payment.id.toLowerCase().includes(searchTerm.toLowerCase())
      || payment.payment_date.toLowerCase().includes(searchTerm.toLowerCase())
      || payment.payment_method.toLowerCase().includes(searchTerm.toLowerCase())
      || payment.status.toLowerCase().includes(searchTerm.toLowerCase())
      || payment.amount.toString().includes(searchTerm)
      || payment.net_amount.toString().includes(searchTerm)
      || payment.base_salary.toString().includes(searchTerm)
    );
    setFilteredPayments(filtered);
  }, [searchTerm, payments]);

  const handleStatusUpdate = async (
    payment: Payment,
    newStatus: PaymentStatus
  ) => {
    try {
      setError(null);
      const updatedPayment = await PaymentStatusManager.updateStatus(payment, newStatus);
      setPayments(payments.map((p) => (p.id === payment.id ? updatedPayment : p)));
    } catch (err: any) {
      console.error('Error updating payment status:', err);
      setError(err.message || 'Failed to update payment status');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        if (profileError) throw profileError;

        const contractsQuery = supabase.from('contracts').select('*');
        if (isEmployer) {
          contractsQuery.eq('employer_id', profile.id);
        } else {
          contractsQuery.eq('worker_id', profile.id);
        }

        const { data: contractsData, error: contractsError } = await contractsQuery;
        if (contractsError) throw contractsError;
        setContracts(contractsData || []);

        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .in('contract_id', contractsData.map((c) => c.id));

        if (paymentsError) throw paymentsError;
        setPayments(paymentsData || []);
        setFilteredPayments(paymentsData || []);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, isEmployer]);

  const handleCreatePayment = async (
    data: PaymentFormData,
    calculation: PaymentCalculation
  ) => {
    try {
      setError(null);

      const { data: newPayment, error: paymentError } = await supabase
        .from('payments')
        .insert([
          {
            contract_id: data.contract_id,
            amount: calculation.gross_amount,
            status: 'pending',
            payment_date: data.payment_date,
            payment_method: data.payment_method,
            base_salary: calculation.base_salary,
            overtime_pay: calculation.overtime_pay,
            overtime_hours_diurnal: data.overtime_hours_diurnal, // Nuevo
            overtime_hours_nocturnal: data.overtime_hours_nocturnal, // Nuevo
            tax_deductions: calculation.tax_deductions,
            social_security_deductions: calculation.social_security_deductions,
            employer_contributions: calculation.employer_contributions, // Nuevo
            net_amount: calculation.net_amount,
          },
        ])
        .select()
        .single();

      if (paymentError) throw paymentError;

      setPayments([...payments, newPayment]);
      setFilteredPayments([...filteredPayments, newPayment]);
      setShowForm(false);
    } catch (err: any) {
      console.error('Error creating payment:', err);
      setError(err.message || 'Failed to create payment');
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
            Payments
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
              New Payment
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
        <PaymentForm
          onSubmit={handleCreatePayment}
          onCancel={() => setShowForm(false)}
          contracts={contracts}
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
                  placeholder="Search payments..."
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

          {filteredPayments.length > 0 ? (
            <PaymentList payments={filteredPayments} onStatusUpdate={handleStatusUpdate} />
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No payments</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 
                  "No payments match your search criteria." : 
                  (isEmployer
                    ? "You haven't made any payments yet."
                    : "You haven't received any payments yet.")}
              </p>
              {isEmployer && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    New Payment
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