-- Bhoomi Setu synthetic-demo schema. Safe to run repeatedly in Supabase SQL Editor.
CREATE TABLE IF NOT EXISTS cases (id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, synthetic BOOLEAN NOT NULL);
CREATE TABLE IF NOT EXISTS people (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS family_relationships (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS land_parcels (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS parcel_geometries (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, parcel_id TEXT NOT NULL, geometry_json TEXT NOT NULL, source_type TEXT NOT NULL, source_reference TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS survey_records (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS verification_results (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS case_actions (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS timeline_events (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS review_packets (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS document_extractions (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, document_id TEXT NOT NULL, status TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS anchor_events (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, subject_type TEXT NOT NULL, subject_id TEXT NOT NULL, payload_hash TEXT NOT NULL, prev_hash TEXT, signed_by TEXT NOT NULL, signed_at TEXT NOT NULL, UNIQUE(case_id, subject_type, subject_id));
CREATE INDEX IF NOT EXISTS documents_case_id ON documents(case_id);
CREATE INDEX IF NOT EXISTS parcels_case_id ON land_parcels(case_id);
CREATE INDEX IF NOT EXISTS parcel_geometries_case_parcel ON parcel_geometries(case_id, parcel_id);
CREATE INDEX IF NOT EXISTS packets_case_id ON review_packets(case_id);
CREATE INDEX IF NOT EXISTS extraction_document_id ON document_extractions(case_id, document_id, created_at);
CREATE INDEX IF NOT EXISTS anchor_events_case_id ON anchor_events(case_id);

CREATE OR REPLACE FUNCTION raise_anchor_events_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'anchor_events is append-only';
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'prevent_anchor_events_update_delete'
  ) THEN
    CREATE TRIGGER prevent_anchor_events_update_delete
    BEFORE UPDATE OR DELETE ON anchor_events
    FOR EACH ROW EXECUTE FUNCTION raise_anchor_events_append_only();
  END IF;
END $$;

