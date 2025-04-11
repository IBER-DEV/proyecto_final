/*
  # Add payment calculation fields

  1. Changes
    - Add detailed payment calculation fields to payments table
    - Add appropriate constraints for new fields

  2. Details
    - All new fields are numeric with appropriate constraints
    - Fields track various components of payment calculation:
      - base_salary: Regular hours pay
      - overtime_pay: Additional pay for overtime hours
      - tax_deductions: Amount withheld for taxes
      - social_security_deductions: Amount withheld for social security
      - net_amount: Final amount after all deductions
*/

-- Add payment calculation fields
ALTER TABLE payments
ADD COLUMN base_salary numeric NOT NULL CHECK (base_salary >= 0),
ADD COLUMN overtime_pay numeric NOT NULL DEFAULT 0 CHECK (overtime_pay >= 0),
ADD COLUMN tax_deductions numeric NOT NULL CHECK (tax_deductions >= 0),
ADD COLUMN social_security_deductions numeric NOT NULL CHECK (social_security_deductions >= 0),
ADD COLUMN net_amount numeric NOT NULL CHECK (net_amount >= 0);