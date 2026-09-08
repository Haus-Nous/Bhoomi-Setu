export type MetricEvent = { operation: "document_preparation" | "extraction" | "verification" | "guidance" | "review_packet"; outcome: "success" | "failure"; durationMs: number; metadata?: Record<string, string | number | boolean> };
export interface MetricSink { record(event: MetricEvent): void; snapshot(): MetricEvent[]; reset(): void; }

export class InMemoryMetricSink implements MetricSink {
  private events: MetricEvent[] = [];
  record(event: MetricEvent) { this.events.push({ ...event, metadata: event.metadata ? { ...event.metadata } : undefined }); }
  snapshot() { return [...this.events]; }
  reset() { this.events = []; }
}

export const metrics = new InMemoryMetricSink();
export function observe(sink: MetricSink, event: MetricEvent) { try { sink.record(event); } catch { /* Telemetry must never break a citizen workflow. */ } }
export function measure<T>(sink: MetricSink, operation: MetricEvent["operation"], work: () => T, metadata?: MetricEvent["metadata"]): T { const started = performance.now(); try { const value = work(); observe(sink, { operation, outcome: "success", durationMs: performance.now() - started, metadata }); return value; } catch (error) { observe(sink, { operation, outcome: "failure", durationMs: performance.now() - started, metadata }); throw error; } }
export async function measureAsync<T>(sink: MetricSink, operation: MetricEvent["operation"], work: () => Promise<T>, metadata?: MetricEvent["metadata"], outcomeForValue?: (value: T) => MetricEvent["outcome"]): Promise<T> { const started = performance.now(); try { const value = await work(); observe(sink, { operation, outcome: outcomeForValue?.(value) ?? "success", durationMs: performance.now() - started, metadata }); return value; } catch (error) { observe(sink, { operation, outcome: "failure", durationMs: performance.now() - started, metadata }); throw error; } }
