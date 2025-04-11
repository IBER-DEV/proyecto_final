export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'employer' | 'worker';
  verified: boolean;
  created_at: string;
}

export type ContractStatus = 'draft' | 'pending' | 'active' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Contract {
  id: string;
  employer_id: string;
  worker_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  salary: number;
  payment_frequency: 'weekly' | 'biweekly' | 'monthly';
  status: ContractStatus;
  signed_by_employer: boolean;
  signed_by_worker: boolean;
  created_at: string;
  // Payroll calculation fields
  hours_per_week: number;
  overtime_rate_diurnal: number;
  overtime_rate_nocturnal: number;
  risk_level: number;
}

export interface Payment {
  id: string;
  contract_id: string;
  amount: number;
  status: PaymentStatus;
  payment_date: string;
  payment_method: 'bank_transfer' | 'digital_wallet';
  created_at: string;
  // Payment calculation fields
  base_salary: number;
  overtime_pay: number;
  overtime_hours_diurnal: number; // Nuevo
  overtime_hours_nocturnal: number; // Nuevo
  tax_deductions: number;
  social_security_deductions: number;
  net_amount: number;
  employer_contributions: number; // Nuevo
}

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  default_terms: string;
  default_payment_frequency: 'weekly' | 'biweekly' | 'monthly';
  default_tax_rate: number;
  default_social_security_rate: number;
  created_at: string;
}

export interface EducationalResource {
  id: string;
  title: string;
  description: string;
  category: string;
  video_url: string;
  video_credit?: string; // Opcional para manejar casos sin crédito
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_time: number;
  created_at: string;
  updated_at: string;
}
