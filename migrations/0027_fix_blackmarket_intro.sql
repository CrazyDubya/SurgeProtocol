-- Migration: Fix Black Market Introduction
-- Sets Dispatcher Chen as the introducer for Fast Eddie

UPDATE black_market_contacts
SET introduction_npc_id = '8972d64d-feea-4037-bc21-733ca9868d55' -- Dispatcher Chen
WHERE id = '5db9de5a-35d0-4d78-82a9-aae70f3e3013';
