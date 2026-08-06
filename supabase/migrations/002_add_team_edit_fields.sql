-- Migration: Add install_notes and drive_type columns to teams table
-- Run this against your Supabase database

ALTER TABLE teams ADD COLUMN IF NOT EXISTS install_notes TEXT DEFAULT '';
ALTER TABLE teams ADD COLUMN IF NOT EXISTS drive_type TEXT DEFAULT 'other';
