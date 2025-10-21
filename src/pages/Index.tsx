import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import SecretInput from '@/components/SecretInput';
import SecretFeed from '@/components/SecretFeed';
import { Secret, ReactionType } from '@/types/secret';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const REACTIONS_KEY = 'lovisec-reactions';

const Index = () => {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [userReactions, setUserReactions] = useState<Record<string, ReactionType>>(() => {
    const saved = localStorage.getItem(REACTIONS_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  // Load secrets from database
  useEffect(() => {
    loadSecrets();
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('secrets-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'secrets'
        },
        (payload) => {
          const newSecret = payload.new as Secret;
          setSecrets((prev) => [newSecret, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'secrets'
        },
        (payload) => {
          const updatedSecret = payload.new as Secret;
          setSecrets((prev) =>
            prev.map((secret) =>
              secret.id === updatedSecret.id ? updatedSecret : secret
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Save user reactions to localStorage
  useEffect(() => {
    localStorage.setItem(REACTIONS_KEY, JSON.stringify(userReactions));
  }, [userReactions]);

  const loadSecrets = async () => {
    try {
      const { data, error } = await supabase
        .from('secrets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSecrets((data || []) as Secret[]);
    } catch (error) {
      console.error('Error loading secrets:', error);
      toast.error('Error al cargar los secretos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSecret = async (content: string) => {
    try {
      const { error } = await supabase
        .from('secrets')
        .insert({
          content,
          reactions: { turbio: 0, impresionante: 0, noMeGusta: 0 }
        });

      if (error) throw error;
      
      // The realtime subscription will add it to the list
    } catch (error) {
      console.error('Error creating secret:', error);
      toast.error('Error al publicar el secreto');
    }
  };

  const handleReact = async (secretId: string, reaction: ReactionType) => {
    const currentReaction = userReactions[secretId];
    const secret = secrets.find((s) => s.id === secretId);
    
    if (!secret) return;

    try {
      const newReactions = { ...secret.reactions };
      
      // Remove previous reaction
      if (currentReaction) {
        newReactions[currentReaction] = Math.max(0, newReactions[currentReaction] - 1);
      }

      // Add new reaction if different
      if (currentReaction !== reaction) {
        newReactions[reaction] = newReactions[reaction] + 1;
      }

      const { error } = await supabase
        .from('secrets')
        .update({ reactions: newReactions })
        .eq('id', secretId);

      if (error) throw error;

      // Update local user reactions
      setUserReactions((prev) => {
        const newUserReactions = { ...prev };
        if (currentReaction === reaction) {
          delete newUserReactions[secretId];
        } else {
          newUserReactions[secretId] = reaction;
        }
        return newUserReactions;
      });
    } catch (error) {
      console.error('Error updating reaction:', error);
      toast.error('Error al actualizar la reacción');
    }
  };

  // Update secrets with user reactions
  const secretsWithReactions = secrets.map((secret) => ({
    ...secret,
    userReaction: userReactions[secret.id] || null,
  }));

  if (loading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando secretos...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Background gradient effect */}
        <div className="fixed inset-0 pointer-events-none">
          <div 
            className="absolute inset-0 opacity-50"
            style={{ background: 'var(--gradient-glow)' }}
          />
        </div>

        <div className="relative z-10">
          <Header />
          <main className="container mx-auto pb-16">
            <SecretInput onSubmit={handleSubmitSecret} />
            <SecretFeed secrets={secretsWithReactions} onReact={handleReact} />
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Index;
