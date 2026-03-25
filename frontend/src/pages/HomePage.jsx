import React, { useEffect, useState, useRef } from 'react';
import {
  Plus, Edit3, Eye, Trash2, Moon, Sun,
  FileJson, Upload, LogOut, FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { api } from '@/api/client';

export default function HomePage({
  isEditor, onOpenEditor, onOpenViewer, onLogout, onLoginClick,
  theme, onToggleTheme, toast
}) {
  const [projects, setProjects] = useState([]);
  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const importRef = useRef();

  useEffect(() => { loadProjects(); }, []);

  async function loadProjects() {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } finally {
      setLoading(false);
    }
  }

  async function createProject() {
    if (!newName.trim()) return;
    try {
      const p = await api.createProject(newName.trim());
      setProjects(prev => [p, ...prev]);
      setNewName('');
      setShowCreate(false);
      toast({ title: 'Projekt erstellt' });
    } catch (e) {
      toast({ title: 'Fehler', description: e.message, variant: 'destructive' });
    }
  }

  async function deleteProject(id, name) {
    if (!confirm(`"${name}" wirklich löschen?`)) return;
    try {
      await api.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Gelöscht' });
    } catch (e) {
      toast({ title: 'Fehler', description: e.message, variant: 'destructive' });
    }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const p = await api.importProject(data);
      setProjects(prev => [p, ...prev]);
      toast({ title: 'Importiert' });
    } catch (err) {
      toast({ title: 'Import fehlgeschlagen', description: err.message, variant: 'destructive' });
    }
    e.target.value = '';
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm tracking-tight">Organigramm</span>
          </div>
          <div className="flex-1" />
          {isEditor ? (
            <>
              <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
              <Button size="sm" variant="ghost" onClick={() => importRef.current?.click()} className="text-muted-foreground hover:text-foreground">
                <Upload className="w-4 h-4" /> Import
              </Button>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" /> Neu
              </Button>
              <div className="w-px h-5 bg-border mx-1" />
              <Button size="icon" variant="ghost" onClick={onLogout} title="Abmelden" className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={onLoginClick}>
              <Edit3 className="w-4 h-4" /> Editor
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={onToggleTheme} className="text-muted-foreground hover:text-foreground">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-5 py-10">
        {loading ? (
          <div className="text-center text-muted-foreground py-20 text-sm">Lade...</div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FolderOpen className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground mb-1">Keine Projekte vorhanden</p>
            <p className="text-sm text-muted-foreground mb-6">Erstelle dein erstes Organigramm-Projekt</p>
            {isEditor && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" /> Erstes Projekt erstellen
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map(p => (
              <div
                key={p.id}
                className="group bg-card border border-border rounded-xl p-4 hover:border-border/80 hover:shadow-md transition-all duration-150 cursor-default"
                onClick={() => onOpenViewer(p)}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm leading-snug truncate">{p.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(p.updated_at).toLocaleDateString('de-DE', {
                        day: '2-digit', month: '2-digit', year: 'numeric'
                      })}
                    </p>
                  </div>
                  {isEditor && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0 -mt-0.5 -mr-1 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); deleteProject(p.id, p.name); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => onOpenViewer(p)}>
                    <Eye className="w-3.5 h-3.5" /> Ansicht
                  </Button>
                  {isEditor && (
                    <Button size="sm" className="flex-1 h-8" onClick={() => onOpenEditor(p)}>
                      <Edit3 className="w-3.5 h-3.5" /> Editor
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neues Projekt</DialogTitle>
          </DialogHeader>
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createProject()}
            placeholder="Projektname"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Abbrechen</Button>
            <Button onClick={createProject} disabled={!newName.trim()}>Erstellen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
