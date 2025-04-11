/*
  # Add payroll calculation fields to contracts table

  1. Changes
    - Add hours_per_week column
    - Add overtime_rate column
    - Add tax_rate column
    - Add social_security_rate column

  2. Details
    - All new fields have appropriate constraints and default values
    - hours_per_week defaults to 40 (standard work week)
    - overtime_rate defaults to 1.5 (time and a half)
    - tax_rate defaults to 0.15 (15%)
    - social_security_rate defaults to 0.0765 (7.65%)
*/

-- Add new columns to contracts table
ALTER TABLE contracts
ADD COLUMN hours_per_week numeric NOT NULL DEFAULT 40 CHECK (hours_per_week > 0),
ADD COLUMN overtime_rate numeric NOT NULL DEFAULT 1.5 CHECK (overtime_rate >= 1),
ADD COLUMN tax_rate numeric NOT NULL DEFAULT 0.15 CHECK (tax_rate >= 0 AND tax_rate <= 1),
ADD COLUMN social_security_rate numeric NOT NULL DEFAULT 0.0765 CHECK (social_security_rate >= 0 AND social_security_rate <= 1);