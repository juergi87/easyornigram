import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
export default function NodeSidebar({ node, departments, onUpdate, onDelete, onClose }) {
  const [form, setForm] = useState({
    title: '',
    department: '',
    employees: [],
    notes: ''
  });
  const [newEmployee, setNewEmployee] = useState('');

  useEffect(() => {
    if (node) {
      setForm({
        title: node.data.title || '',
        department: node.data.department || '',
        employees: node.data.employees || [],
        notes: node.data.notes || ''
      });
    }
  }, [node?.id]);

  if (!node) return null;

  function handleChange(field, value) {
    const updated = { ...form, [field]: value };
    setForm(updated);
    onUpdate(node.id, updated);
  }

  function addEmployee() {
    const name = newEmployee.trim();
    if (!name) return;
    const updated = [...form.employees, name];
    handleChange('employees', updated);
    setNewEmployee('');
  }

  function removeEmployee(i) {
    const updated = form.employees.filter((_, idx) => idx !== i);
    handleChange('employees', updated);
  }

  return (
    <aside className="w-76 border-l border-border bg-card flex flex-col h-full overflow-hidden" style={{ width: '300px' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm">Position</h3>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Titel</Label>
          <Input
            value={form.title}
            onChange={e => handleChange('title', e.target.value)}
            placeholder="z.B. Geschäftsführer"
            className="h-9"
          />
        </div>

        {/* Department */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Abteilung</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {(departments || []).map(dept => (
              <button
                key={dept.value}
                onClick={() => handleChange('department', dept.value)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-all ${
                  form.department === dept.value
                    ? 'border-transparent text-white shadow-sm'
                    : 'border-border hover:border-border/60 hover:bg-accent'
                }`}
                style={form.department === dept.value ? { backgroundColor: dept.color } : {}}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: dept.color }}
                />
                {dept.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Employees */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mitarbeiter</Label>
          {form.employees.length > 0 && (
            <div className="space-y-0.5 mb-2">
              {form.employees.map((emp, i) => (
                <div key={i} className="flex items-center gap-2 group px-2 py-1 rounded-md hover:bg-accent">
                  <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 text-sm truncate">{emp}</span>
                  <button
                    onClick={() => removeEmployee(i)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-1.5">
            <Input
              value={newEmployee}
              onChange={e => setNewEmployee(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addEmployee()}
              placeholder="Name hinzufügen..."
              className="text-sm h-9"
            />
            <Button size="icon" variant="outline" onClick={addEmployee} className="flex-shrink-0 h-9 w-9">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Notes */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notizen</Label>
          <Textarea
            value={form.notes}
            onChange={e => handleChange('notes', e.target.value)}
            placeholder="Notizen..."
            rows={4}
            className="text-sm resize-none"
          />
        </div>
      </div>

      {/* Delete */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(node.id)}
        >
          <Trash2 className="w-4 h-4" />
          Position löschen
        </Button>
      </div>
    </aside>
  );
}
