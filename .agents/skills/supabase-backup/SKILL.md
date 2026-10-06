---
name: supabase-backup
description: Create an encrypted local logical backup of the Skill Dockyard Supabase database before migrations or on the recurring backup schedule.
---

# Skill Dockyard Supabase backup

This skill creates a timestamped, encrypted archive outside the repository. It never commits or uploads database contents.

## One-time setup

```bash
brew install supabase/tap/supabase age
mkdir -p ~/.config/age
age-keygen -o ~/.config/age/skilldockyard-backup.txt
chmod 600 ~/.config/age/skilldockyard-backup.txt
grep '^# public key:' ~/.config/age/skilldockyard-backup.txt
```

Keep the private age key separate from the backups. Set `AGE_RECIPIENT` to the public key and set `SUPABASE_DB_URL` from the Supabase Connect dialog. The database URL contains a password and must remain local and untracked.

## Create a backup

From the repository root:

```bash
export SUPABASE_DB_URL='postgresql://...'
export AGE_RECIPIENT='age1...'
npm run backup:supabase
```

Backups are written to `~/SkillDockyard-backups/` by default. Set `SKILL_DOCKYARD_BACKUP_DIR` to override that location. Run this before every production migration and on the recurring schedule recorded in `OPS-004`.

The archive contains roles, schema, data, and a manifest. It excludes Supabase vector-storage metadata tables as documented by Supabase's logical-backup procedure.

## Restore verification

Never restore over production. Decrypt an archive into a disposable local or staging database, restore with `psql --single-transaction --file`, then run the aggregate integrity queries and migration checks from the production launch checklist. A backup without the private age key cannot be restored.
