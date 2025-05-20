import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Briefcase, CreditCard, FileText, TrendingUp, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Contract, Payment } from '../types';

interface DashboardStats {
  activeContracts: number;
  totalCounterparties: number;
  pendingPayments: number;
  monthlyEarnings: number;
  recentContracts: Contract[];
  recentPayments: Payment[];
}

export function Dashboard() {
  const { user } = useAuthStore();
  const isEmployer = user?.role === 'employer';
  const [stats, setStats] = useState<DashboardStats>({
    activeContracts: 0,
    totalCounterparties: 0,
    pendingPayments: 0,
    monthlyEarnings: 0,
    recentContracts: [],
    recentPayments: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user?.id)
          .single();
  
        if (!profile) return;
  
        const contractFilter = isEmployer
          ? { column: 'employer_id', value: profile.id }
          : { column: 'worker_id', value: profile.id };
  
        const contractsPromise = supabase
          .from('contracts')
          .select('*')
          .eq(contractFilter.column, contractFilter.value)
          .order('created_at', { ascending: false });
  
        const paymentsPromise = supabase
          .from('payments')
          .select('*')
          .order('payment_date', { ascending: false });
  
        const [contractsRes, paymentsRes] = await Promise.all([
          contractsPromise,
          paymentsPromise
        ]);
  
        const contracts = contractsRes.data || [];
        const relatedContractIds = contracts.map(c => c.id);
        const payments = (paymentsRes.data || []).filter(p => relatedContractIds.includes(p.contract_id));
  
        const activeContracts = contracts.filter(c => c.status === 'active').length;
        const counterparties = new Set(contracts.map(c => isEmployer ? c.worker_id : c.employer_id)).size;
        const pendingPayments = payments.filter(p => p.status === 'pending').length;
  
        const now = new Date();
        const monthlyEarnings = payments
          .filter(p => {
            const date = new Date(p.payment_date);
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          })
          .reduce((sum, p) => sum + (isEmployer ? -p.amount : p.net_amount), 0);
  
        setStats({
          activeContracts,
          totalCounterparties: counterparties,
          pendingPayments,
          monthlyEarnings,
          recentContracts: contracts.slice(0, 5),
          recentPayments: payments.slice(0, 5)
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
  
    if (user) {
      fetchDashboardData();
    }
  }, [user, isEmployer]);
  

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Active Contracts',
      value: stats.activeContracts,
      icon: FileText,
      change: '+0%',
      changeType: 'positive',
      link: '/contracts'
    },
    {
      name: isEmployer ? 'Total Workers' : 'Total Employers',
      value: stats.totalCounterparties,
      icon: Briefcase,
      change: '+0%',
      changeType: 'positive',
      link: '/contracts'
    },
    {
      name: 'Pending Payments',
      value: stats.pendingPayments,
      icon: CreditCard,
      change: '0%',
      changeType: 'neutral',
      link: '/payments'
    },
    {
      name: 'Monthly Earnings',
      value: `$${Math.abs(stats.monthlyEarnings).toLocaleString()}`,
      icon: TrendingUp,
      change: '+0%',
      changeType: 'positive',
      link: '/payments'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Welcome back, {user?.full_name}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.link}
              className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow hover:bg-gray-50 transition-colors duration-200 sm:px-6 sm:pt-6"
            >
              <dt>
                <div className="absolute rounded-md bg-blue-500 p-3">
                  <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-gray-500">
                  {item.name}
                </p>
              </dt>
              <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                <p
                  className={`ml-2 flex items-baseline text-sm font-semibold ${
                    item.changeType === 'positive'
                      ? 'text-green-600'
                      : item.changeType === 'negative'
                      ? 'text-red-600'
                      : 'text-gray-500'
                  }`}
                >
                  {item.change}
                </p>
              </dd>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-lg bg-white shadow">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                Recent Contracts
              </h3>
              <Link
                to="/contracts"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View all
              </Link>
            </div>
            <div className="mt-6">
              {stats.recentContracts.length > 0 ? (
                <ul role="list" className="divide-y divide-gray-200">
                  {stats.recentContracts.map((contract) => (
                    <li key={contract.id}>
                      <Link
                        to={`/contracts/${contract.id}`}
                        className="block hover:bg-gray-50"
                      >
                        <div className="flex items-center px-4 py-4 sm:px-6">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="truncate text-sm font-medium text-blue-600">
                                {contract.title}
                              </p>
                              <div className="ml-2 flex flex-shrink-0">
                                <p className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                  contract.status === 'active' ? 'bg-green-100 text-green-800' :
                                  contract.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 flex">
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="truncate">
                                  ${contract.salary.toLocaleString()}/{contract.payment_frequency}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="ml-5 flex-shrink-0">
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No contracts</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {isEmployer
                      ? "You haven't created any contracts yet."
                      : "You haven't received any contracts yet."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white shadow">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                Recent Payments
              </h3>
              <Link
                to="/payments"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View all
              </Link>
            </div>
            <div className="mt-6">
              {stats.recentPayments.length > 0 ? (
                <ul role="list" className="divide-y divide-gray-200">
                  {stats.recentPayments.map((payment) => (
                    <li key={payment.id}>
                      <Link
                        to={`/payments/${payment.id}`}
                        className="block hover:bg-gray-50"
                      >
                        <div className="flex items-center px-4 py-4 sm:px-6">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="truncate text-sm font-medium text-blue-600">
                                Payment #{payment.id.slice(0, 8)}
                              </p>
                              <div className="ml-2 flex flex-shrink-0">
                                <p className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                  payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 flex justify-between">
                              <div className="flex items-center text-sm text-gray-500">
                                <span>${payment.amount.toLocaleString()}</span>
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(payment.payment_date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="ml-5 flex-shrink-0">
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No payments</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {isEmployer
                      ? "You haven't made any payments yet."
                      : "You haven't received any payments yet."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}