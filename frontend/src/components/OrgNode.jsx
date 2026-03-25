import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { getDepartmentColor } from '@/lib/utils';

const OrgNode = memo(({ data, selected }) => {
  const color = getDepartmentColor(data.department);
  const empCount = data.employees?.length || 0;

  return (
    <div
      className={`relative rounded-lg min-w-[190px] max-w-[230px] transition-all duration-150 ${
        selected
          ? 'shadow-lg ring-2 ring-primary/60 ring-offset-1 ring-offset-background'
          : 'shadow-sm hover:shadow-md'
      }`}
      style={{
        background: `color-mix(in srgb, ${color} 6%, hsl(var(--card)))`,
        border: `1px solid color-mix(in srgb, ${color} 30%, hsl(var(--border)))`
      }}
    >
      {/* Department color accent bar */}
      <div className="h-1 rounded-t-lg" style={{ backgroundColor: color }} />

      {/* Content */}
      <div className="px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-card-foreground leading-snug truncate" title={data.title}>
              {data.title || 'Neue Position'}
            </p>
            {data.department && (
              <p className="text-[11px] font-medium mt-0.5 opacity-80" style={{ color }}>
                {data.departmentLabel || data.department}
              </p>
            )}
          </div>
          {data.onToggleCollapse && (
            <button
              className="flex-shrink-0 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground"
              onClick={(e) => { e.stopPropagation(); data.onToggleCollapse(); }}
              title={data.collapsed ? 'Aufklappen' : 'Zuklappen'}
            >
              {data.collapsed
                ? <ChevronRight className="w-3.5 h-3.5" />
                : <ChevronDown className="w-3.5 h-3.5" />
              }
            </button>
          )}
        </div>

        {empCount > 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
            <Users className="w-3 h-3 flex-shrink-0" />
            <span className="text-[11px] truncate leading-tight">
              {empCount === 1 ? data.employees[0] : `${data.employees[0]} +${empCount - 1}`}
            </span>
          </div>
        )}

        {data.collapsed && data.collapsedCount > 0 && (
          <div className="mt-2 text-[11px] text-muted-foreground bg-black/5 dark:bg-white/5 px-2 py-1 rounded text-center">
            {data.collapsedCount} verborgen
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Top} className="!top-0" />
      <Handle type="source" position={Position.Bottom} className="!bottom-0" />
    </div>
  );
});

OrgNode.displayName = 'OrgNode';
export default OrgNode;
