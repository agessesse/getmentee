-- ============================================================================
-- Migration 0022: let action_items.assigned_to become NULL on account deletion
-- ============================================================================
-- Found while testing account deletion after 0019 was applied. Deleting a
-- populated account still failed, with:
--
--   P0001: assigned_to (<NULL>) must be a party to mentorship (...)
--   CONTEXT: PL/pgSQL function validate_action_item_assignment() line 9
--   SQL statement "UPDATE ONLY public.action_items SET assigned_to = NULL
--                  WHERE $1 = assigned_to"
--
-- This is a collision between two migrations that never saw each other:
--
--   0014 added validate_action_item_assignment(), which requires assigned_to to
--        be the mentor or the mentee of the action item's mentorship.
--   0019 retargeted the foreign key to ON DELETE SET NULL, so that an action
--        item survives its assignee's account deletion instead of being erased.
--
-- The cascade therefore issues exactly the UPDATE that 0014's trigger forbids,
-- and the whole deletion aborts. 0019 did its part correctly: there are zero
-- remaining NO ACTION foreign keys. The trigger is what blocks it.
--
-- Fix: treat NULL as a legitimate value meaning "unassigned". That is precisely
-- the state 0019 intends after the assignee is gone, and it is also the natural
-- state for an action item nobody owns yet. Every non-NULL value is still
-- validated exactly as before, so the guarantee 0014 added is not weakened.
--
-- Rollback: restore the function body from
-- 0014_action_item_validation_secure_notifications.sql.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_action_item_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- NULL means unassigned. Reached when the assignee deletes their account and
  -- the ON DELETE SET NULL from 0019 fires, and valid on its own terms.
  IF NEW.assigned_to IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.mentorships m
    WHERE m.id = NEW.mentorship_id
      AND (m.mentor_id = NEW.assigned_to OR m.mentee_id = NEW.assigned_to)
  ) THEN
    RAISE EXCEPTION
      'assigned_to (%) must be a party to mentorship (%): must be the mentor or mentee',
      NEW.assigned_to, NEW.mentorship_id;
  END IF;

  RETURN NEW;
END;
$function$;
