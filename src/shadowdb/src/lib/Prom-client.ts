//// filepath: /B:/git repos B/ShadowDB/src/shadowdb/lib/Prom-client.ts
import promClient from 'prom-client';
// Set default labels such as the app name
promClient.register.setDefaultLabels({
  app: 'shadowdb',
});

// Collect default metrics using default configuration
promClient.collectDefaultMetrics({});

// Export the default registry so you can add custom metrics or expose them via an endpoint.
export const registry = promClient.register;