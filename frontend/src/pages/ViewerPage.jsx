import React, { useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap, ReactFlowProvider, useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Moon, Sun, ArrowLeft, Download, ChevronDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import OrgNode from '@/components/OrgNode';
import { getDepartments } from '@/lib/utils';
import { exportPNG, exportPDF } from '@/lib/export';
import { api } from '@/api/client';

const nodeTypes = { orgNode: OrgNode };

function ViewerInner({ projectId, project, onBack, theme, onToggleTheme }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);
  const { fitView } = useReactFlow();

  useEffect(() => {
    function handleClickOutside(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!project) return;
    const departments = getDepartments();
    const flowNodes = (project.nodes || []).map(n => {
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
          collapsed: false
        },
        draggable: false,
        selectable: false,
        connectable: false
      };
    });
    const flowEdges = (project.edges || []).map(e => ({
      id: e.id || uuidv4(),
      source: e.source,
      target: e.target,
      type: 'smoothstep'
    }));
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [project?.id]);

  async function doExport(fn) {
    setExportOpen(false);
    fitView({ padding: 0.1, duration: 0 });
    await new Promise(r => setTimeout(r, 150));
    fn(document.querySelector('.react-flow'));
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="flex items-center gap-1.5 px-4 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0 relative z-10" style={{ height: '52px' }}>
        <Button variant="ghost" size="icon" onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-px h-5 bg-border mx-0.5" />
        <span className="font-semibold text-sm truncate max-w-[200px]">{project?.name}</span>
        <div className="flex-1" />

        <div className="relative" ref={exportRef}>
          <Button size="sm" variant="ghost" onClick={() => setExportOpen(o => !o)} className="text-muted-foreground hover:text-foreground gap-1.5">
            <Download className="w-4 h-4" /> Export <ChevronDown className="w-3 h-3" />
          </Button>
          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-50 py-1 min-w-[140px]">
              <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent rounded-sm mx-px" onClick={() => doExport(exportPNG)}>PNG</button>
              <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent rounded-sm mx-px" onClick={() => doExport(el => exportPDF(el, 'a4'))}>PDF A4</button>
              <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent rounded-sm mx-px" onClick={() => doExport(el => exportPDF(el, 'a3'))}>PDF A3</button>
            </div>
          )}
        </div>

        <Button size="icon" variant="ghost" onClick={onToggleTheme} className="text-muted-foreground hover:text-foreground">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </header>

      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.05}
          maxZoom={2}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Background variant="dots" gap={16} size={1} />
          <Controls showInteractive={false} />
          <MiniMap zoomable pannable nodeColor={(n) => {
            const dept = getDepartments().find(d => d.value === n.data?.department);
            return dept?.color || '#6b7280';
          }} />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function ViewerPage(props) {
  return (
    <ReactFlowProvider>
      <ViewerInner {...props} />
    </ReactFlowProvider>
  );
}
