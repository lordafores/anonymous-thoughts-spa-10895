import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import SecretInput from '@/components/SecretInput';
import SecretFeed from '@/components/SecretFeed';
import { Secret, ReactionType } from '@/types/secret';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { encryptData, decryptData } from '@/utils/encryption';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

const REACTIONS_KEY = 'lovisec-reactions';
const SECRETS_PER_PAGE = 10;

const Index = () => {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [userReactions, setUserReactions] = useState<Record<string, ReactionType>>(() => {
    const saved = localStorage.getItem(REACTIONS_KEY);
    return saved ? JSON.parse(saved) : {};
  });
  const observerTarget = useRef<HTMLDivElement>(null);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      loadSecrets();
    }
  }, [authLoading]);

  useEffect(() => {
    const channel = supabase
      .channel('secrets-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'secrets' }, (payload) => {
        const newSecret = payload.new as any;
        const decryptedSecret: Secret = {
          ...newSecret,
          content: newSecret.encrypted_content ? decryptData(newSecret.encrypted_content) : newSecret.content,
        };
        setSecrets((prev) => [decryptedSecret, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'secrets' }, (payload) => {
        const updatedSecret = payload.new as any;
        const decryptedSecret: Secret = {
          ...updatedSecret,
          content: updatedSecret.encrypted_content ? decryptData(updatedSecret.encrypted_content) : updatedSecret.content,
        };
        setSecrets((prev) => prev.map((secret) => secret.id === decryptedSecret.id ? decryptedSecret : secret));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(REACTIONS_KEY, JSON.stringify(userReactions));
  }, [userReactions]);

  const loadSecrets = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('secrets')
        .select('*, profile:profiles(*)')
        .order('created_at', { ascending: false })
        .limit(SECRETS_PER_PAGE);

      if (error) throw error;

      const secretsData = ((data || []) as any[]).map((secret) => ({
        ...secret,
        content: secret.encrypted_content ? decryptData(secret.encrypted_content) : secret.content,
      }));
      
      setSecrets(secretsData);
      setHasMore(secretsData.length === SECRETS_PER_PAGE);
    } catch (error) {
      console.error('Error loading secrets:', error);
      toast.error('Error al cargar los secretos');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreSecrets = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const { data, error } = await (supabase as any)
        .from('secrets')
        .select('*, profile:profiles(*)')
        .order('created_at', { ascending: false })
        .range(secrets.length, secrets.length + SECRETS_PER_PAGE - 1);

      if (error) throw error;

      const newSecrets = ((data || []) as any[]).map((secret) => ({
        ...secret,
        content: secret.encrypted_content ? decryptData(secret.encrypted_content) : secret.content,
      }));
      
      setSecrets((prev) => [...prev, ...newSecrets]);
      setHasMore(newSecrets.length === SECRETS_PER_PAGE);
    } catch (error) {
      console.error('Error loading more secrets:', error);
      toast.error('Error al cargar más secretos');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, secrets.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreSecrets();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMoreSecrets, hasMore, loadingMore]);

  const handleSubmitSecret = async (content: string, imageFile?: File | null) => {
    try {
      let imageUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('secret-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('secret-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const encryptedContent = content ? encryptData(content) : null;

      const { error } = await (supabase as any)
        .from('secrets')
        .insert({
          content: content || '[imagen]',
          encrypted_content: encryptedContent,
          image_url: imageUrl,
          user_id: user?.id || null,
          reactions: { turbio: 0, impresionante: 0, noMeGusta: 0 }
        });

      if (error) throw error;
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
      
      if (currentReaction) {
        newReactions[currentReaction] = Math.max(0, newReactions[currentReaction] - 1);
      }

      if (currentReaction !== reaction) {
        newReactions[reaction] = newReactions[reaction] + 1;
      }

      const { error } = await (supabase as any)
        .from('secrets')
        .update({ reactions: newReactions })
        .eq('id', secretId);

      if (error) throw error;

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

  const secretsWithReactions = secrets.map((secret) => ({
    ...secret,
    userReaction: userReactions[secret.id] || null,
  }));

  if (loading || authLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-50" style={{ background: 'var(--gradient-glow)' }} />
        </div>

        <div className="relative z-10">
          <Header />
          
          {!user && (
            <div className="container mx-auto px-4 py-8">
              <div className="max-w-3xl mx-auto text-center p-6 card-gradient rounded-2xl border border-border/50">
                <h2 className="text-2xl font-bold mb-4">¡Bienvenido a LOVISEC!</h2>
                <p className="text-muted-foreground mb-6">
                  Únete a nuestra comunidad anónima. Puedes publicar secretos sin cuenta, 
                  pero con una cuenta obtienes un avatar único y nombre de usuario personalizable.
                </p>
                <Button onClick={() => navigate('/auth')} className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Iniciar Sesión / Registrarse
                </Button>
              </div>
            </div>
          )}
          
          <main className="container mx-auto pb-16">
            <SecretInput onSubmit={handleSubmitSecret} />
            <SecretFeed secrets={secretsWithReactions} onReact={handleReact} />
            {hasMore && (
              <div ref={observerTarget} className="w-full py-8 flex justify-center">
                {loadingMore && (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Index;
