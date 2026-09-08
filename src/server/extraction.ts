import { getDatabase } from "@/server/database";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { z } from "zod";
import type { DocumentExtraction, ExtractedDocument, ExtractionFactKey } from "@/types/case";
import { DOCUMENT_EXTRACTION_PROMPT_VERSION, documentExtractionInstructions } from "@/server/extraction-prompt";
import { measureAsync, metrics } from "@/server/metrics";

export type PreparedDocument = { documentId: string; caseId: string; documentType: string; text: string; metadata: { filename: string; mimeType: string; section: string }; synthetic: true };
const factKeys = ["documentType", "personName", "relationship", "khata", "khesra", "recordedArea", "areaUnit", "location", "surveyReference", "recordDate"] as const;
const extractedDocumentSchema = z.object({ documentType: z.string().min(1), facts: z.array(z.object({ key: z.enum(factKeys), value: z.string().min(1), confidence: z.enum(["low", "medium", "high"]), evidence: z.object({ quote: z.string().min(1), start: z.number().int().nonnegative(), end: z.number().int().positive() }), needsHumanReview: z.boolean(), uncertainty: z.string() })).max(50) }).strict();
const extractionJsonSchema = { type: "object", additionalProperties: false, properties: { documentType: { type: "string" }, facts: { type: "array", maxItems: 50, items: { type: "object", additionalProperties: false, properties: { key: { type: "string", enum: factKeys }, value: { type: "string" }, confidence: { type: "string", enum: ["low", "medium", "high"] }, evidence: { type: "object", additionalProperties: false, properties: { quote: { type: "string" }, start: { type: "integer", minimum: 0 }, end: { type: "integer", minimum: 1 } }, required: ["quote", "start", "end"] }, needsHumanReview: { type: "boolean" }, uncertainty: { type: "string" } }, required: ["key", "value", "confidence", "evidence", "needsHumanReview", "uncertainty"] } } }, required: ["documentType", "facts"] };
export class ExtractionValidationError extends Error { constructor(message = "The extraction response was invalid or not grounded in the source document.") { super(message); } }
export class ExtractionConfigurationError extends Error { constructor() { super("AI extraction is unavailable because the selected provider is not configured."); } }
export interface ExtractionProvider { readonly name: string; readonly model: string; extract(document: PreparedDocument): Promise<unknown>; }
export const extractionProviderNames = ["gemini", "openai"] as const;
export type ExtractionProviderName = (typeof extractionProviderNames)[number];
export type GeminiClient = { models: { generateContent(input: { model: string; contents: string; config: { systemInstruction: string; responseMimeType: string; responseJsonSchema: unknown } }): Promise<{ text?: string }> } };

export class OpenAIExtractionProvider implements ExtractionProvider {
  readonly name = "openai";
  readonly model: string;
  private client: OpenAI;
  constructor(apiKey = process.env.OPENAI_API_KEY, model = process.env.OPENAI_EXTRACTION_MODEL || "gpt-4.1-mini") { if (!apiKey) throw new ExtractionConfigurationError(); this.client = new OpenAI({ apiKey }); this.model = model; }
  async extract(document: PreparedDocument) {
    const response = await this.client.responses.create({ model: this.model, input: [{ role: "system", content: documentExtractionInstructions }, { role: "user", content: document.text }], text: { format: { type: "json_schema", name: "document_extraction", strict: true, schema: { type: "object", additionalProperties: false, properties: { documentType: { type: "string" }, facts: { type: "array", maxItems: 50, items: { type: "object", additionalProperties: false, properties: { key: { type: "string", enum: factKeys }, value: { type: "string" }, confidence: { type: "string", enum: ["low", "medium", "high"] }, evidence: { type: "object", additionalProperties: false, properties: { quote: { type: "string" }, start: { type: "integer", minimum: 0 }, end: { type: "integer", minimum: 1 } }, required: ["quote", "start", "end"] }, needsHumanReview: { type: "boolean" }, uncertainty: { type: "string" } }, required: ["key", "value", "confidence", "evidence", "needsHumanReview", "uncertainty"] } } }, required: ["documentType", "facts"] } } } });
    return JSON.parse(response.output_text);
  }
}

export class GeminiExtractionProvider implements ExtractionProvider {
  readonly name = "gemini";
  readonly model: string;
  private client: GeminiClient;
  constructor(apiKey = process.env.GEMINI_API_KEY, model = process.env.GEMINI_EXTRACTION_MODEL || "gemini-2.5-flash", client?: GeminiClient) { if (!apiKey) throw new ExtractionConfigurationError(); this.client = client ?? new GoogleGenAI({ apiKey }); this.model = model; }
  async extract(document: PreparedDocument) { const response = await this.client.models.generateContent({ model: this.model, contents: document.text, config: { systemInstruction: documentExtractionInstructions, responseMimeType: "application/json", responseJsonSchema: extractionJsonSchema } }); if (!response.text) throw new Error("Empty provider response"); return JSON.parse(response.text); }
}

export function parseExtractionProvider(provider = process.env.AI_EXTRACTION_PROVIDER): ExtractionProviderName { if (provider === "gemini" || provider === "openai") return provider; throw new ExtractionConfigurationError(); }
export function resolveExtractionProvider(provider = process.env.AI_EXTRACTION_PROVIDER): ExtractionProvider { const selected = parseExtractionProvider(provider); return selected === "gemini" ? new GeminiExtractionProvider() : new OpenAIExtractionProvider(); }

export function validateExtraction(raw: unknown, sourceText: string): ExtractedDocument {
  const parsed = extractedDocumentSchema.safeParse(raw); if (!parsed.success) throw new ExtractionValidationError();
  for (const fact of parsed.data.facts) { const { quote, start, end } = fact.evidence; if (end <= start || sourceText.slice(start, end) !== quote || !sourceText.includes(quote) || !isFactGrounded(fact.key, fact.value, quote)) throw new ExtractionValidationError(); }
  return parsed.data;
}

const normalizeIdentifier = (value: string) => value.trim().toUpperCase().replace(/\s+/g, "");
const normalizeText = (value: string) => value.toLowerCase().replace(/[\s.,_-]+/g, "");
const normalizeAreaUnit = (value: string) => value.trim().toLowerCase().replace(/s$/, "");
const labelledValue = (quote: string, labels: string[]) => { const label = labels.map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"); return quote.match(new RegExp(`(?:${label})\\s*:\\s*(.+)`, "i"))?.[1]?.trim() ?? quote.trim(); };
const parseAreaEvidence = (quote: string) => { const match = quote.match(/(?:Area|Recorded area)\s*:\s*([0-9]+(?:\.[0-9]+)?)\s*(acre|acres)\b/i); if (!match) return null; const value = Number(match[1]); return Number.isFinite(value) ? { value, unit: "acre" } : null; };

function isFactGrounded(key: ExtractionFactKey, value: string, quote: string) {
  if (!value.trim()) return false;
  if (key === "khata" || key === "khesra") return normalizeIdentifier(value) === normalizeIdentifier(labelledValue(quote, [key]));
  if (key === "recordedArea") { const evidence = parseAreaEvidence(quote); const numeric = Number(value); return Boolean(evidence && Number.isFinite(numeric) && numeric === evidence.value); }
  if (key === "areaUnit") { const evidence = parseAreaEvidence(quote); return Boolean(evidence && normalizeAreaUnit(value) === evidence.unit); }
  if (key === "personName") return normalizeText(value) === normalizeText(labelledValue(quote, ["Recorded holder", "Recorded name", "Grandparent", "Parent", "Family member under review"]));
  if (key === "relationship") return normalizeText(value) === normalizeText(labelledValue(quote, ["Relationship"]));
  if (key === "documentType") return normalizeText(value) === normalizeText(labelledValue(quote, ["Document type", "Type"]));
  if (key === "surveyReference") return normalizeText(value) === normalizeText(labelledValue(quote, ["Map reference", "Survey reference"]));
  if (key === "location") return normalizeText(value) === normalizeText(labelledValue(quote, ["Mauza", "Location", "Village"]));
  if (key === "recordDate") return normalizeText(value) === normalizeText(labelledValue(quote, ["Record date", "Date"]));
  return normalizeText(value) === normalizeText(quote);
}

export interface ExtractionRepository { save(value: DocumentExtraction): Promise<void>; latest(caseId: string, documentId: string): Promise<DocumentExtraction | null>; }
export class SqliteExtractionRepository implements ExtractionRepository {
  async save(value: DocumentExtraction) { await getDatabase().initialize(); await getDatabase().execute({ sql: "INSERT INTO document_extractions (id,case_id,document_id,status,payload,created_at) VALUES (?,?,?,?,?,?)", params: [value.id, value.caseId, value.documentId, value.status, JSON.stringify(value), value.createdAt] }); }
  async latest(caseId: string, documentId: string) { await getDatabase().initialize(); const row = (await getDatabase().query<{ payload: string }>({ sql: "SELECT payload FROM document_extractions WHERE case_id = ? AND document_id = ? ORDER BY created_at DESC LIMIT 1", params: [caseId, documentId] }))[0]; return row ? JSON.parse(row.payload) as DocumentExtraction : null; }
}

export class ExtractionService {
  constructor(private provider: ExtractionProvider, private repository: ExtractionRepository = new SqliteExtractionRepository()) {}
  async extract(document: PreparedDocument): Promise<DocumentExtraction> { return measureAsync(metrics, "extraction", async () => { const createdAt = new Date().toISOString(); try { const raw = await this.provider.extract(document); const result = validateExtraction(raw, document.text); const extraction: DocumentExtraction = { id: crypto.randomUUID(), caseId: document.caseId, documentId: document.documentId, status: "completed", result, provider: this.provider.name, model: this.provider.model, promptVersion: DOCUMENT_EXTRACTION_PROMPT_VERSION, createdAt }; await this.repository.save(extraction); return extraction; } catch (error) { const extraction: DocumentExtraction = { id: crypto.randomUUID(), caseId: document.caseId, documentId: document.documentId, status: "failed", provider: this.provider.name, model: this.provider.model, promptVersion: DOCUMENT_EXTRACTION_PROMPT_VERSION, createdAt, error: { code: error instanceof ExtractionValidationError ? "INVALID_MODEL_OUTPUT" : "PROVIDER_FAILURE", message: error instanceof ExtractionValidationError ? error.message : "AI extraction failed. No fields were accepted." } }; await this.repository.save(extraction); return extraction; } }, { caseId: document.caseId, documentId: document.documentId, synthetic: true }, (extraction) => extraction.status === "completed" ? "success" : "failure"); }
}
