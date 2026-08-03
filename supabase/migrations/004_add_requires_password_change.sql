-- Migration: Add requires_password_change column to users table
-- Description: Tracking whether a user has updated their initial/reset temporary password

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT true;

-- Set default false for pre-existing active users
UPDATE public.users 
SET requires_password_change = false 
WHERE requires_password_change IS NULL;
