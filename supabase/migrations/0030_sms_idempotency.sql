-- SMS idempotency — make inbound-webhook replays and Twilio retries no-ops.
--
-- The inbound webhook (app/api/sms/inbound) verifies Twilio's HMAC signature but the
-- signature is a pure function of (URL + params), so a captured valid POST replayed
-- verbatim re-verifies every time; Twilio also retries on any non-2xx. Without a
-- uniqueness key on the message sid, each replay/retry inserted a DUPLICATE row (and a
-- duplicate audit row). Twilio MessageSids are unique per message, so a partial unique
-- index on (firm_id, twilio_sid) lets recordSms() insert-or-ignore: a repeat sid is a
-- no-op. Partial (where twilio_sid is not null) so rows without a sid are unconstrained.
-- Idempotent: create-if-not-exists.

-- First collapse any pre-existing duplicates so the unique index can be built on live data.
-- Duplicates are by definition the same message recorded twice (same firm_id + MessageSid);
-- we keep one row per group (ctid as an arbitrary stable tiebreaker) and drop the rest. Only
-- sms_messages is touched — the append-only audit_log (0029) is never modified.
delete from public.sms_messages a
  using public.sms_messages b
  where a.twilio_sid is not null
    and a.firm_id = b.firm_id
    and a.twilio_sid = b.twilio_sid
    and a.ctid > b.ctid;

create unique index if not exists sms_messages_firm_twilio_sid_uniq
  on public.sms_messages(firm_id, twilio_sid)
  where twilio_sid is not null;
