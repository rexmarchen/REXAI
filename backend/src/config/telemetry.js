import dotenv from 'dotenv';
dotenv.config();

import { NodeSDK } from '@opentelemetry/sdk-node';
import { LangfuseSpanProcessor } from '@langfuse/otel';
import { startActiveObservation, startObservation, propagateAttributes, updateActiveObservation } from '@langfuse/tracing';
import { observeOpenAI } from '@langfuse/openai';

const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
const secretKey = process.env.LANGFUSE_SECRET_KEY;
const baseUrl = process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com';

let spanProcessor = null;
let sdk = null;

if (publicKey && secretKey) {
  try {
    spanProcessor = new LangfuseSpanProcessor({
      publicKey,
      secretKey,
      baseUrl,
      environment: process.env.NODE_ENV || 'development',
    });

    sdk = new NodeSDK({
      spanProcessors: [spanProcessor],
    });

    sdk.start();
    console.log('[Langfuse] OpenTelemetry SDK initialized successfully (cloud.langfuse.com)');
  } catch (err) {
    console.warn('[Langfuse] Failed to initialize OpenTelemetry SDK:', err.message);
  }
} else {
  console.warn('[Langfuse] Missing LANGFUSE_PUBLIC_KEY or LANGFUSE_SECRET_KEY. Tracing will be disabled.');
}

/**
 * Flush all buffered traces to Langfuse.
 */
export async function flushTelemetry() {
  if (spanProcessor) {
    try {
      await spanProcessor.forceFlush();
    } catch (e) {
      console.error('[Langfuse] Error flushing spans:', e.message);
    }
  }
}

export {
  spanProcessor,
  sdk,
  startActiveObservation,
  startObservation,
  propagateAttributes,
  updateActiveObservation,
  observeOpenAI,
};
