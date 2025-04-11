/*
  # Initial Schema Setup

  1. New Tables
    - `profiles`: User profiles with role-based access
    - `contracts`: Work contracts between employers and workers
    - `payments`: Payment records for contracts

  2. Security
    - Enable RLS on all tables
    - Add policies for:
      - Profile viewing and updating
      - Contract creation and viewing
      - Payment creation and viewing

  3. Features
    - Role-based access control (employer/worker)
    - Contract status tracking
    - Payment processing
    - Digital signatures
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('employer', 'worker')),
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create contracts table
CREATE TABLE contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid REFERENCES profiles NOT NULL,
  worker_id uuid REFERENCES profiles NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  salary numeric NOT NULL CHECK (salary > 0),
  payment_frequency text NOT NULL CHECK (payment_frequency IN ('weekly', 'biweekly', 'monthly')),
  status text NOT NULL CHECK (status IN ('draft', 'pending', 'active', 'completed', 'cancelled')),
  signed_by_employer boolean DEFAULT false,
  signed_by_worker boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Create payments table
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES contracts NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  payment_date date NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('bank_transfer', 'digital_wallet')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Contracts policies
CREATE POLICY "Employers can create contracts"
  ON contracts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
      AND role = 'employer'
    )
  );

CREATE POLICY "Users can view their own contracts"
  ON contracts FOR SELECT
  USING (
    employer_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
    OR
    worker_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Payments policies
CREATE POLICY "Users can view payments for their contracts"
  ON payments FOR SELECT
  USING (
    contract_id IN (
      SELECT id FROM contracts
      WHERE employer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR worker_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Employers can create payments"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contracts c
      JOIN profiles p ON c.employer_id = p.id
      WHERE p.user_id = auth.uid()
      AND c.id = contract_id
    )
  );