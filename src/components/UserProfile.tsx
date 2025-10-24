import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PixelAvatar from './PixelAvatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

interface UserProfileProps {
  open: boolean;
  onClose: () => void;
}

const UserProfile = ({ open, onClose }: UserProfileProps) => {
  const { profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username || '');
  const [loading, setLoading] = useState(false);

  const handleGenerateNewAvatar = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      const newSeed = crypto.randomUUID();
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ avatar_seed: newSeed })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Avatar actualizado');
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error('Error al actualizar avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!profile || !username.trim()) return;
    
    if (username.length < 3) {
      toast.error('El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }

    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ username: username.trim() })
        .eq('id', profile.id);

      if (error) {
        if (error.code === '23505') {
          toast.error('Este nombre de usuario ya está en uso');
        } else {
          throw error;
        }
      } else {
        await refreshProfile();
        toast.success('Nombre de usuario actualizado');
      }
    } catch (error) {
      console.error('Error updating username:', error);
      toast.error('Error al actualizar nombre de usuario');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mi Perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <PixelAvatar seed={profile.avatar_seed} size={120} />
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateNewAvatar}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Generar nuevo avatar
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Nombre de usuario</Label>
            <div className="flex gap-2">
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tu nombre de usuario"
                disabled={loading}
              />
              <Button 
                onClick={handleUpdateUsername}
                disabled={loading || username === profile.username}
              >
                Actualizar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfile;
