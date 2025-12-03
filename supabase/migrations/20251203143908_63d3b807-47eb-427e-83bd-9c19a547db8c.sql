-- Fix Security Definer View issue: make parent_dashboard_summary respect RLS
-- This ensures the view enforces RLS policies of the querying user, not the view creator

ALTER VIEW public.parent_dashboard_summary SET (security_invoker = true);