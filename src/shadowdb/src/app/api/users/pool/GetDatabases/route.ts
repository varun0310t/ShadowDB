import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import "../../../../../db/index";
import { getDefaultReaderPool } from "../../../../../lib/userPools";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all databases and their associated HAProxy and PgPool instances in a single query
    const query = `
      SELECT 
        d.id as database_id, 
        d.name as database_name, 
        d.tenancy_type, 
        d.status as database_status,
        d.patroni_scope,
        d.created_at, 
        d.updated_at,
        ud.access_level,
        
        -- HAProxy information
        h.id as haproxy_id,
        h.container_name as haproxy_container,
        h.read_port as haproxy_read_port,
        h.write_port as haproxy_write_port,
        h.status as haproxy_status,
        
        -- PgPool information
        p.id as pgpool_id,
        p.container_name as pgpool_container,
        p.port as pgpool_port,
        p.status as pgpool_status,
        p.enable_connection_pooling,
        p.enable_query_cache,
        p.enable_load_balancing
        
      FROM databases d
      JOIN user_databases ud ON d.id = ud.database_id
      LEFT JOIN haproxy_instances h ON d.haproxy_id = h.id
      LEFT JOIN pgpool_instances p ON d.pgpool_id = p.id
      WHERE ud.user_id = $1 AND d.is_replica = false
      ORDER BY d.created_at DESC
    `;

    const values = [session.user.id];
    const result = await getDefaultReaderPool().query(query, values);

    if (result.rowCount === 0) {
      return NextResponse.json({ databases: [] });
    }

    // Process the results into a clean structure
    const databases = result.rows.map(row => ({
      id: row.database_id,
      tenancy_type: row.tenancy_type,
      db_name: row.database_name,
      access_level: row.access_level,
      status: row.database_status,
      patroni_scope: row.patroni_scope,
      created_at: row.created_at,
      updated_at: row.updated_at,
      haproxy_enabled: !!row.haproxy_id,
      haproxy: row.haproxy_id ? {
        id: row.haproxy_id,
        container_name: row.haproxy_container,
        read_port: row.haproxy_read_port,
        write_port: row.haproxy_write_port,
        status: row.haproxy_status
      } : null,
      pgpool_enabled: !!row.pgpool_id,
      pgpool: row.pgpool_id ? {
        id: row.pgpool_id,
        container_name: row.pgpool_container,
        port: row.pgpool_port,
        status: row.pgpool_status,
        enable_connection_pooling: row.enable_connection_pooling,
        enable_query_cache: row.enable_query_cache,
        enable_load_balancing: row.enable_load_balancing
      } : null
    }));

    return NextResponse.json({
      message: "Database information retrieved successfully",
      databases: databases
    });

  } catch (error) {
    console.error("Error fetching databases:", error);
    return NextResponse.json(
      { error: "Failed to fetch databases" },
      { status: 500 }
    );
  }
}