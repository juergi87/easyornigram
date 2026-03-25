import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap,
  addEdge, applyNodeChanges, applyEdgeChanges,
  useReactFlow, ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Plus, Save, LayoutTemplate, Download,
  Moon, Sun, ArrowLeft, ChevronDown, Palette
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import OrgNode from '@/components/OrgNode';
import NodeSidebar from '@/components/NodeSidebar';
import DepartmentsDialog from '@/components/DepartmentsDialog';
import { autoLayout } from '@/lib/layout';
import { exportPNG, exportPDF } from '@/lib/export';
import { getDepartments, saveDepartments } from '@/lib/utils';
import { api } from '@/api/client';

const nodeTypes = { orgNode: OrgNode };

function buildFlowNodes(rawNodes, onToggleCollapse, departments) {
  return rawNodes.map(n => {
    const dept = departments.find(d => d.value === n.department);
    return {
      id: n.id,
      type: 'orgNode',
      position: n.position || { x: n.position_x || 0, y: n.position_y || 0 },
      data: {
        title: n.title,
        department: n.department,
        departmentLabel: dept?.label || '',
        employees: n.employees || [],
        notes: n.notes || '',
        collapsed: n.collapsed || false,
        onToggleCollapse: () => onToggleCollapse(n.id)
      }
    };
  });
}

function EditorInner({ projectId, project, onBack, onSaved, theme, onToggleTheme, toast }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [departments, setDepartments] = useState(getDepartments);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const exportRef = useRef(null);
  const flowRef = useRef(null);
  const { fitView } = useReactFlow();

  // Close export dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCollapse = useCallback((nodeId) => {
    setNodes(prev => prev.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, collapsed: !n.data.collapsed } } : n
    ));
    setDirty(true);
  }, []);

  useEffect(() => {
    if (!project) return;
    const flowNodes = buildFlowNodes(project.nodes || [], toggleCollapse, departments);
    const flowEdges = (project.edges || []).map(e => ({
      id: e.id || uuidv4(),
      source: e.source,
      target: e.target,
      type: 'smoothstep'
    }));
    setNodes(flowNodes);
    setEdges(flowEdges);
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [project?.id]);

  const onNodesChange = useCallback((changes) => {
    setNodes(prev => applyNodeChanges(changes, prev));
    setDirty(true);
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges(prev => applyEdgeChanges(changes, prev));
    setDirty(true);
  }, []);

  const onConnect = useCallback((params) => {
    setEdges(prev => addEdge({ ...params, type: 'smoothstep', id: uuidv4() }, prev));
    setDirty(true);
  }, []);

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  function addNode() {
    const id = uuidv4();
    const node = {
      id,
      type: 'orgNode',
      position: { x: Math.random() * 300 + 50, y: Math.random() * 200 + 50 },
      data: {
        title: 'Neue Position',
        department: '',
        departmentLabel: '',
        employees: [],
        notes: '',
        collapsed: false,
        onToggleCollapse: () => toggleCollapse(id)
      }
    };
    setNodes(prev => [...prev, node]);
    setSelectedNode(node);
    setDirty(true);
  }

  function handleUpdateNode(nodeId, formData) {
    const dept = departments.find(d => d.value === formData.department);
    setNodes(prev => prev.map(n => {
      if (n.id !== nodeId) return n;
      const updated = {
        ...n,
        data: {
          ...n.data,
          ...formData,
          departmentLabel: dept?.label || '',
          onToggleCollapse: () => toggleCollapse(nodeId)
        }
      };
      if (selectedNode?.id === nodeId) setSelectedNode(updated);
      return updated;
    }));
    setDirty(true);
  }

  function handleDeleteNode(nodeId) {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
    setDirty(true);
  }

  function handleAutoLayout() {
    const laid = autoLayout(nodes, edges);
    setNodes(laid);
    setDirty(true);
    setTimeout(() => fitView({ padding: 0.2 }), 50);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const saveNodes = nodes.map(n => ({
        id: n.id,
        position: n.position,
        data: n.data
      }));
      await api.saveGraph(projectId, saveNodes, edges);
      setDirty(false);
      onSaved?.();
      toast({ title: 'Gespeichert' });
    } catch (e) {
      toast({ title: 'Fehler beim Speichern', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  function handleDepartmentsSave(updated) {
    saveDepartments(updated);
    setDepartments(updated);
    // Re-label all nodes with new department names
    setNodes(prev => prev.map(n => {
      const dept = updated.find(d => d.value === n.data?.department);
      return dept ? { ...n, data: { ...n.data, departmentLabel: dept.label } } : n;
    }));
  }

  async function handleExportJSON() {
    window.open(api.exportProject(projectId), '_blank');
  }

  async function handleExportPNG() {
    fitView({ padding: 0.1, duration: 0 });
    await new Promise(r => setTimeout(r, 150));
    const wrapper = document.querySelector('.react-flow');
    await exportPNG(wrapper);
  }

  async function handleExportPDF(format) {
    fitView({ padding: 0.1, duration: 0 });
    await new Promise(r => setTimeout(r, 150));
    const wrapper = document.querySelector('.react-flow');
    await exportPDF(wrapper, format);
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Toolbar */}
      <header className="flex items-center gap-1.5 px-4 h-13 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0 relative z-10" style={{ height: '52px' }}>
        <Button variant="ghost" size="icon" onClick={onBack} title="Zurück" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-px h-5 bg-border mx-0.5" />
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-sm truncate max-w-[200px]">{project?.name}</span>
          {dirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Ungespeicherte Änderungen" />}
        </div>
        <div className="flex-1" />

        <Button size="sm" variant="ghost" onClick={addNode} className="text-muted-foreground hover:text-foreground gap-1.5">
          <Plus className="w-4 h-4" /> Position
        </Button>
        <Button size="icon" variant="ghost" onClick={handleAutoLayout} title="Auto-Layout" className="text-muted-foreground hover:text-foreground">
          <LayoutTemplate className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => setDeptDialogOpen(true)} title="Abteilungen bearbeiten" className="text-muted-foreground hover:text-foreground">
          <Palette className="w-4 h-4" />
        </Button>
        <div className="w-px h-5 bg-border mx-0.5" />

        {/* Export dropdown — click based */}
        <div className="relative" ref={exportRef}>
          <Button size="sm" variant="ghost" onClick={() => setExportOpen(o => !o)} className="text-muted-foreground hover:text-foreground gap-1.5">
            <Download className="w-4 h-4" /> Export <ChevronDown className="w-3 h-3" />
          </Button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-50 py-1 min-w-[140px]">
              <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent rounded-sm mx-px" onClick={() => { setExportOpen(false); handleExportPNG(); }}>PNG</button>
              <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent rounded-sm mx-px" onClick={() => { setExportOpen(false); handleExportPDF('a4'); }}>PDF A4</button>
              <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent rounded-sm mx-px" onClick={() => { setExportOpen(false); handleExportPDF('a3'); }}>PDF A3</button>
              <div className="my-1 border-t border-border" />
              <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent rounded-sm mx-px" onClick={() => { setExportOpen(false); handleExportJSON(); }}>JSON</button>
            </div>
          )}
        </div>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !dirty}
          className="gap-1.5"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Speichern...' : 'Speichern'}
        </Button>

        <Button size="icon" variant="ghost" onClick={onToggleTheme} className="text-muted-foreground hover:text-foreground">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </header>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        <div ref={flowRef} className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
            minZoom={0.1}
            maxZoom={2}
            defaultEdgeOptions={{ type: 'smoothstep' }}
          >
            <Background variant="dots" gap={16} size={1} />
            <Controls />
            <MiniMap zoomable pannable nodeColor={(n) => {
              const dept = departments.find(d => d.value === n.data?.department);
              return dept?.color || '#6b7280';
            }} />
          </ReactFlow>
        </div>

        {selectedNode && (
          <NodeSidebar
            node={selectedNode}
            departments={departments}
            onUpdate={handleUpdateNode}
            onDelete={handleDeleteNode}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>

      <DepartmentsDialog
        open={deptDialogOpen}
        onClose={() => setDeptDialogOpen(false)}
        departments={departments}
        onSave={handleDepartmentsSave}
      />
    </div>
  );
}

export default function EditorPage(props) {
  return (
    <ReactFlowProvider>
      <EditorInner {...props} />
    </ReactFlowProvider>
  );
}
