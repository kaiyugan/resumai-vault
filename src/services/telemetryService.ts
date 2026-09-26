export interface TelemetryEvent {
  event_name: string;
  step_number?: number;
  ats_score_baseline?: number;
  ats_score_tailored?: number;
  time_spent_ms?: number;
  job_domain?: string;
  import_method?: 'chrome_extension' | 'jina_url' | 'raw_text';
  metadata?: Record<string, any>;
  timestamp?: string;
}

class TelemetryService {
  private queue: TelemetryEvent[] = [];
  private sessionHash: string;
  private batchSize = 5;
  private flushIntervalMs = 10000;

  constructor() {
    this.sessionHash = this.getOrCreateSessionHash();
    this.startAutoFlush();
  }

  private getOrCreateSessionHash(): string {
    let hash = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('telemetry_session_hash') : null;
    if (!hash) {
      hash = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('telemetry_session_hash', hash);
      }
    }
    return hash;
  }

  /**
   * Emit an anonymized event to the telemetry queue
   */
  public trackEvent(event: TelemetryEvent): void {
    const payload: TelemetryEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    // Strip potential PII from metadata if present
    if (payload.metadata) {
      delete payload.metadata.email;
      delete payload.metadata.name;
      delete payload.metadata.phone;
      delete payload.metadata.raw_text;
      delete payload.metadata.resume_content;
    }

    this.queue.push(payload);

    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush batched events to backend endpoint using sendBeacon or fetch
   */
  public async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const eventsToSend = [...this.queue];
    this.queue = [];

    const body = JSON.stringify({
      session_hash: this.sessionHash,
      events: eventsToSend,
    });

    const endpoint = '/api/v1/analytics/events';

    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        const success = navigator.sendBeacon(endpoint, blob);
        if (!success) {
          await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: true,
          });
        }
      } else {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        });
      }
    } catch (err) {
      console.warn('[TelemetryService] Failed to send telemetry batch:', err);
      if (this.queue.length < 50) {
        this.queue.unshift(...eventsToSend);
      }
    }
  }

  private startAutoFlush(): void {
    if (typeof window !== 'undefined') {
      setInterval(() => this.flush(), this.flushIntervalMs);
      window.addEventListener('beforeunload', () => this.flush());
    }
  }
}

export const telemetry = new TelemetryService();
