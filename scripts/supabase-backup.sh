#!/usr/bin/env bash

set -Eeuo pipefail
umask 077

backup_root="${SKILL_DOCKYARD_BACKUP_DIR:-${HOME}/SkillDockyard-backups}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"

command -v supabase >/dev/null 2>&1 || { printf '%s\n' 'Install the Supabase CLI first.' >&2; exit 1; }
command -v age >/dev/null 2>&1 || { printf '%s\n' 'Install age first: brew install age' >&2; exit 1; }
[[ -n "${SUPABASE_DB_URL:-}" ]] || { printf '%s\n' 'SUPABASE_DB_URL is required.' >&2; exit 1; }
[[ -n "${AGE_RECIPIENT:-}" ]] || { printf '%s\n' 'AGE_RECIPIENT is required.' >&2; exit 1; }

mkdir -p "$backup_root"
work_dir="$(mktemp -d "${backup_root}/.tmp-${timestamp}.XXXXXX")"
archive="${backup_root}/supabase-${timestamp}.tar.gz.age"
checksum="${archive}.sha256"
trap 'rm -rf "$work_dir"' EXIT

supabase db dump --db-url "$SUPABASE_DB_URL" --role-only --file "${work_dir}/roles.sql"
supabase db dump --db-url "$SUPABASE_DB_URL" --file "${work_dir}/schema.sql"
supabase db dump --db-url "$SUPABASE_DB_URL" --data-only --use-copy \
  --exclude storage.buckets_vectors --exclude storage.vector_indexes \
  --file "${work_dir}/data.sql"
{
  printf 'created_at=%s\n' "$timestamp"
  printf 'supabase_cli=%s\n' "$(supabase --version)"
  printf 'contents=roles.sql,schema.sql,data.sql\n'
} > "${work_dir}/manifest.txt"

tar -C "$work_dir" -czf - . | age --encrypt --recipient "$AGE_RECIPIENT" --output "$archive" -
shasum -a 256 "$archive" > "$checksum"
printf 'Encrypted Supabase backup created: %s\n' "$archive"
