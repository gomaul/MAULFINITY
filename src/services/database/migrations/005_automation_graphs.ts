import Database from 'better-sqlite3'

export function migration005(db: Database.Database): void {
  // 1. Automation Graphs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS automation_graphs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      version TEXT NOT NULL DEFAULT '1.0.0',
      author TEXT DEFAULT 'User',
      tags TEXT DEFAULT '[]',
      graph_data TEXT NOT NULL DEFAULT '{}',
      profile_id TEXT NOT NULL DEFAULT 'default',
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    )
  `)

  // 2. Graph Variables Table (persistent state)
  db.exec(`
    CREATE TABLE IF NOT EXISTS graph_variables (
      id TEXT PRIMARY KEY,
      graph_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'number',
      value TEXT NOT NULL DEFAULT '0',
      profile_id TEXT NOT NULL DEFAULT 'default',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (graph_id) REFERENCES automation_graphs(id) ON DELETE CASCADE,
      UNIQUE(graph_id, name)
    )
  `)

  // 3. Graph Execution History
  db.exec(`
    CREATE TABLE IF NOT EXISTS graph_executions (
      id TEXT PRIMARY KEY,
      graph_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running',
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      duration_ms INTEGER,
      nodes_executed INTEGER DEFAULT 0,
      error_message TEXT,
      FOREIGN KEY (graph_id) REFERENCES automation_graphs(id) ON DELETE CASCADE
    )
  `)

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_automation_graphs_profile_id ON automation_graphs(profile_id);
    CREATE INDEX IF NOT EXISTS idx_automation_graphs_enabled ON automation_graphs(enabled);
    CREATE INDEX IF NOT EXISTS idx_graph_variables_graph_id ON graph_variables(graph_id);
    CREATE INDEX IF NOT EXISTS idx_graph_executions_graph_id ON graph_executions(graph_id);
    CREATE INDEX IF NOT EXISTS idx_graph_executions_status ON graph_executions(status);
    CREATE INDEX IF NOT EXISTS idx_graph_executions_started_at ON graph_executions(started_at);
  `)

  console.log('Migration 005_automation_graphs completed - automation_graphs, graph_variables, graph_executions tables created')
}
