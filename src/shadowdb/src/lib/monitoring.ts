import { Counter, Histogram } from "prom-client";

// Counter for total queries
export const queryCounter = new Counter({
  name: "query_total",
  help: "Total number of executed queries",
  labelNames: ["userId", "db_name", "queryType"], // for example: read or write
});

// Counter for failed queries
export const queryFailureCounter = new Counter({
  name: "query_failure_total",
  help: "Total number of failed queries",
  labelNames: ["userId", "db_name", "queryType"],
});

// Histogram for query execution duration (in seconds)
export const queryDurationHistogram = new Histogram({
  name: "query_duration_seconds",
  help: "Duration of query execution in seconds",
  labelNames: ["userId", "db_name", "queryType"],
  buckets: [0.1, 0.5, 1, 2, 5, 10], // buckets for response time
});
