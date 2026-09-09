#!/usr/bin/env bash
# Apply pending Supabase migrations to the remote database.
#
# Usage:
#   DB_PASSWORD=<your-db-password> bash scripts/apply-migrations.sh
#
# The project ref is read from NEXT_PUBLIC_SUPABASE_URL in .env.local.
# The database password is the one set in Supabase Dashboard →
# Project Settings → Database → Database Password.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Load env
if [ -f "${ROOT}/.env.local" ]; then
  set -a
  source "${ROOT}/.env.local"
  set +a
fi

if [ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ]; then
  echo "ERROR: NEXT_PUBLIC_SUPABASE_URL not set." >&2
  exit 1
fi

if [ -z "${DB_PASSWORD:-}" ]; then
  echo "ERROR: DB_PASSWORD not set." >&2
  echo "Run: DB_PASSWORD=<your-password> bash scripts/apply-migrations.sh" >&2
  exit 1
fi

# Extract project ref from URL (e.g. https://abcdefgh.supabase.co → abcdefgh)
PROJECT_REF=$(echo "${NEXT_PUBLIC_SUPABASE_URL}" | sed 's|https://||' | cut -d. -f1)

echo "Applying pending migrations to project: ${PROJECT_REF}"

supabase db push \
  --project-ref "${PROJECT_REF}" \
  --password "${DB_PASSWORD}" \
  --workdir "${ROOT}"

echo "Done."
