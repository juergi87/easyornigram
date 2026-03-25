import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/api/client';

export default function LoginPage({ onLogin, toast }) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.login(pin);
      onLogin();
    } catch (err) {
      setError(err.message || 'Falscher PIN');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-[340px] px-4">
        <div className="flex flex-col items-center mb-7">
          <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-md shadow-primary/20">
            <Lock className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Editor-Zugang</h1>
          <p className="text-sm text-muted-foreground mt-1.5 text-center">
            PIN eingeben um den Editor zu öffnen
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pin" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="••••"
                autoFocus
                className="text-center text-2xl tracking-[0.5em] h-12 font-mono"
              />
            </div>
            {error && (
              <p className="text-xs text-destructive text-center bg-destructive/10 rounded-md py-2">{error}</p>
            )}
            <Button type="submit" className="w-full h-10" disabled={loading || !pin}>
              {loading ? 'Prüfen...' : 'Anmelden'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
