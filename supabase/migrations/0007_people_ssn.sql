-- PII: people.ssn holds an envelope-encrypted token (AES-256-GCM, KEK-wrapped
-- DEK) — never plaintext. Excluded from the default read projection; only the
-- explicit getPersonSsn decrypts it.
alter table people add column ssn text;
