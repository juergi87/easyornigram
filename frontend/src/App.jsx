import React, { useState, useEffect } from 'react';
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from '@/components/ui/toast';
import { useToast } from '@/lib/useToast';
import { useTheme } from '@/lib/useTheme';
import { api } from '@/api/client';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import EditorPage from '@/pages/EditorPage';
import ViewerPage from '@/pages/ViewerPage';

// Route based on URL path
function getRoute() {
  const path = window.location.pathname;
  if (path.startsWith('/edit')) return 'edit';
  if (path.startsWith('/view')) return 'view';
  return 'home';
}

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { toasts, toast } = useToast();

  const [route, setRoute] = useState(getRoute());
  const [isEditor, setIsEditor] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [view, setView] = useState('home'); // home | login | editor | viewer

  useEffect(() => {
    api.authStatus().then(({ authenticated }) => {
      setIsEditor(authenticated);
      setAuthChecked(true);
      // Auto-redirect if /edit or /view
      if (route === 'edit' && !authenticated) {
        setView('login');
      }
    }).catch(() => setAuthChecked(true));
  }, []);

  async function openEditor(project) {
    try {
      const data = await api.getProject(project.id);
      setCurrentProject(project);
      setProjectData(data);
      setView('editor');
    } catch (e) {
      toast({ title: 'Fehler', description: e.message, variant: 'destructive' });
    }
  }

  async function openViewer(project) {
    try {
      const data = await api.getProject(project.id);
      setCurrentProject(project);
      setProjectData(data);
      setView('viewer');
    } catch (e) {
      toast({ title: 'Fehler', description: e.message, variant: 'destructive' });
    }
  }

  async function handleLogin() {
    setIsEditor(true);
    setView('home');
  }

  async function handleLogout() {
    try { await api.logout(); } catch {}
    setIsEditor(false);
    setView('home');
  }

  if (!authChecked) return null;

  const commonProps = { theme, onToggleTheme: toggleTheme, toast };

  return (
    <ToastProvider>
      {view === 'home' && (
        <HomePage
          {...commonProps}
          isEditor={isEditor}
          onOpenEditor={openEditor}
          onOpenViewer={openViewer}
          onLogout={handleLogout}
          onLoginClick={() => setView('login')}
        />
      )}
      {view === 'login' && !isEditor && (
        <LoginPage {...commonProps} onLogin={handleLogin} />
      )}
      {view === 'editor' && isEditor && projectData && (
        <EditorPage
          {...commonProps}
          projectId={currentProject.id}
          project={projectData}
          onBack={() => setView('home')}
          onSaved={() => {}}
        />
      )}
      {view === 'viewer' && projectData && (
        <ViewerPage
          {...commonProps}
          projectId={currentProject.id}
          project={projectData}
          onBack={() => setView('home')}
        />
      )}

      {toasts.map(t => (
        <Toast key={t.id} open={t.open} variant={t.variant}>
          {t.title && <ToastTitle>{t.title}</ToastTitle>}
          {t.description && <ToastDescription>{t.description}</ToastDescription>}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
