import React, { useEffect, useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DEPARTMENTS } from '@/lib/utils';

export default function DepartmentsDialog({ open, onClose, departments, onSave }) {
  const [local, setLocal] = useState(departments);

  useEffect(() => {
    if (open) setLocal(departments);
  }, [open]);

  if (!open) return null;

  function handleChange(value, field, val) {
    setLocal(prev => prev.map(d => d.value === value ? { ...d, [field]: val } : d));
  }

  function handleReset() {
    setLocal(DEPARTMENTS.map(d => ({ ...d })));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-lg shadow-xl w-[360px] flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-sm">Abteilungen bearbeiten</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-2">
          {local.map(dept => (
            <div key={dept.value} className="flex items-center gap-2">
              <input
                type="color"
                value={dept.color}
                onChange={e => handleChange(dept.value, 'color', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent p-0.5 flex-shrink-0"
                title="Farbe ändern"
              />
              <Input
                value={dept.label}
                onChange={e => handleChange(dept.value, 'label', e.target.value)}
                className="flex-1 h-8 text-sm"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Zurücksetzen
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Abbrechen</Button>
            <Button size="sm" onClick={() => { onSave(local); onClose(); }}>Speichern</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
