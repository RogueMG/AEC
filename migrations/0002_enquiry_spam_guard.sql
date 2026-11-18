-- Enquiry form support: whether the notification email went out, and a short-lived log of
-- submissions per visitor for rate limiting. Visitors are stored only as a salted SHA-256
-- hash of their IP address, never the address itself; rows older than a day are purged.
ALTER TABLE enquiries ADD COLUMN notified INTEGER NOT NULL DEFAULT 0 CHECK (notified IN (0, 1));

CREATE TABLE enquiry_attempts (
  id          INTEGER PRIMARY KEY,
  visitor     TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX enquiry_attempts_visitor ON enquiry_attempts (visitor, created_at);
