import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from './db.js';
import { requireAuth } from './auth.js';

const router = Router();

// GET all projects
router.get('/', (req, res) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();
  res.json(projects);
});

// GET single project with nodes + edges
router.get('/:id', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Nicht gefunden' });

  const nodes = db.prepare('SELECT * FROM nodes WHERE project_id = ?').all(req.params.id);
  const edges = db.prepare('SELECT * FROM edges WHERE project_id = ?').all(req.params.id);

  const parsedNodes = nodes.map(n => ({
    ...n,
    employees: JSON.parse(n.employees),
    collapsed: Boolean(n.collapsed),
    position: { x: n.position_x, y: n.position_y }
  }));

  res.json({ ...project, nodes: parsedNodes, edges });
});

// POST create project
router.post('/', requireAuth, (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name erforderlich' });

  const id = uuidv4();
  db.prepare('INSERT INTO projects (id, name) VALUES (?, ?)').run(id, name.trim());
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.status(201).json(project);
});

// PUT update project name
router.put('/:id', requireAuth, (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name erforderlich' });

  db.prepare("UPDATE projects SET name = ?, updated_at = datetime('now') WHERE id = ?")
    .run(name.trim(), req.params.id);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Nicht gefunden' });
  res.json(project);
});

// DELETE project
router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Nicht gefunden' });
  res.json({ ok: true });
});

// PUT save full graph (nodes + edges)
router.put('/:id/graph', requireAuth, (req, res) => {
  const { nodes, edges } = req.body;
  const projectId = req.params.id;

  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
  if (!project) return res.status(404).json({ error: 'Nicht gefunden' });

  const saveGraph = db.transaction(() => {
    db.prepare('DELETE FROM nodes WHERE project_id = ?').run(projectId);
    db.prepare('DELETE FROM edges WHERE project_id = ?').run(projectId);

    const insertNode = db.prepare(`
      INSERT INTO nodes (id, project_id, title, department, employees, notes, position_x, position_y, collapsed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const n of (nodes || [])) {
      insertNode.run(
        n.id, projectId,
        n.data?.title || n.title || '',
        n.data?.department || n.department || '',
        JSON.stringify(n.data?.employees || n.employees || []),
        n.data?.notes || n.notes || '',
        n.position?.x ?? 0,
        n.position?.y ?? 0,
        n.data?.collapsed || n.collapsed ? 1 : 0
      );
    }

    const insertEdge = db.prepare(`
      INSERT INTO edges (id, project_id, source, target)
      VALUES (?, ?, ?, ?)
    `);
    for (const e of (edges || [])) {
      insertEdge.run(e.id || uuidv4(), projectId, e.source, e.target);
    }

    db.prepare("UPDATE projects SET updated_at = datetime('now') WHERE id = ?").run(projectId);
  });

  saveGraph();
  res.json({ ok: true });
});

// GET export as JSON
router.get('/:id/export', (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Nicht gefunden' });

  const nodes = db.prepare('SELECT * FROM nodes WHERE project_id = ?').all(req.params.id);
  const edges = db.prepare('SELECT * FROM edges WHERE project_id = ?').all(req.params.id);

  const data = {
    version: 1,
    project,
    nodes: nodes.map(n => ({ ...n, employees: JSON.parse(n.employees) })),
    edges
  };

  res.setHeader('Content-Disposition', `attachment; filename="${project.name}.json"`);
  res.json(data);
});

// POST import from JSON
router.post('/import', requireAuth, (req, res) => {
  const { version, project, nodes, edges } = req.body;
  if (!project?.name) return res.status(400).json({ error: 'Ungültiges Format' });

  const newProjectId = uuidv4();

  const doImport = db.transaction(() => {
    db.prepare('INSERT INTO projects (id, name) VALUES (?, ?)').run(newProjectId, project.name);

    const insertNode = db.prepare(`
      INSERT INTO nodes (id, project_id, title, department, employees, notes, position_x, position_y, collapsed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const n of (nodes || [])) {
      insertNode.run(
        uuidv4(), newProjectId,
        n.title || '', n.department || '',
        JSON.stringify(n.employees || []),
        n.notes || '',
        n.position_x || 0, n.position_y || 0, n.collapsed ? 1 : 0
      );
    }
  });

  doImport();
  const newProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(newProjectId);
  res.status(201).json(newProject);
});

export default router;
