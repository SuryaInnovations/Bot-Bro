# NOVA AI — Enterprise Backup and Disaster Recovery Strategy

**Document Version**: 2.0  
**Target Environment**: Supabase PostgreSQL / Cloud Infrastructure  
**Security Standard**: SOC2, HIPAA, GDPR Compliant Isolation  

---

## 1. RPO AND RTO OBJECTIVES

- **Recovery Point Objective (RPO)**: <= 5 minutes (Point-in-Time Recovery via WAL replication)
- **Recovery Time Objective (RTO)**: <= 15 minutes for primary cluster failover

---

## 2. BACKUP TOPOLOGY & ARCHITECTURE

### 2.1 Automated Continuous Backups
1. **Physical Backups**: Full cluster base backups performed daily at 02:00 UTC.
2. **Continuous WAL Archiving**: Write-Ahead Logs (WAL) streamed continuously to multi-region encrypted S3 / GCS buckets with 99.999999999% durability.
3. **Point-In-Time Recovery (PITR)**: Retention window of 30 days enabling granular recovery to any exact millisecond.

### 2.2 Logical Backups (`pg_dump`)
- Daily automated snapshots of `public` schema tables (`profiles`, `conversations`, `messages`, `artifacts`, `user_memories`, `personal_tasks`, `calendar_events`, `email_messages`, `background_jobs`).
- Encrypted with AES-256-GCM before offsite replication.

---

## 3. USER DATA ISOLATION & GDPR RECOVERY

- Every table is strictly protected by **PostgreSQL Row Level Security (RLS)** using `auth.uid() = user_id`.
- User data exports are delivered via `/api/auth/export-data` as encrypted JSON packages.
- User account deletions cascade cleanly across foreign keys, eliminating orphaned data.

---

## 4. INCIDENT RECOVERY RUNBOOK

1. **Detection**: Automated heartbeat telemetry alert to on-call team.
2. **Traffic Isolation**: Direct traffic to static degraded maintenance page if database connectivity drops.
3. **Failover**: Trigger read-replica promotion or restore to target timestamp via PITR.
4. **Verification**: Execute automated test runner `node tests/test-runner.js` against recovered instance.
5. **DNS Traffic Resumption**: Switch API ingress back to verified operational instance.
