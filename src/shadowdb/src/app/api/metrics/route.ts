//// filepath: /B:/git repos B/ShadowDB/src/shadowdb/api/metrics.ts
import { NextResponse } from 'next/server';
import { registry } from '../../../lib/Prom-client';

export async function GET(_req: Request) {
  const metrics = await registry.metrics();
  return new NextResponse(metrics, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}