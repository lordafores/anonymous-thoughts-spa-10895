import { useState, useEffect } from 'react';
import { Comment, ReactionType } from '@/types/secret';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Flame, Star, ThumbsDown, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import PixelAvatar from './PixelAvatar';
import ImageUpload from './ImageUpload';
import { encryptData, decryptData } from '@/utils/encryption';

interface CommentSectionProps {
  secretId: string;
}

const CommentSection = ({ secretId }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { user, profile } = useAuth();
  const [userReactions, setUserReactions] = useState<Record<string, ReactionType>>(() => {
    const saved = localStorage.getItem(`lovisec-comment-reactions-${secretId}`);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [secretId, showComments]);

  useEffect(() => {
    if (!showComments) return;

    const channel = supabase
      .channel(`comments-${secretId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `secret_id=eq.${secretId}`
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [secretId, showComments]);

  useEffect(() => {
    localStorage.setItem(`lovisec-comment-reactions-${secretId}`, JSON.stringify(userReactions));
  }, [userReactions, secretId]);

  const loadComments = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('comments')
        .select('*, profile:profiles(*)')
        .eq('secret_id', secretId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const decryptedComments = (data || []).map((comment: any) => ({
        ...comment,
        content: comment.encrypted_content ? decryptData(comment.encrypted_content) : comment.content,
        userReaction: userReactions[comment.id] || null
      }));

      setComments(decryptedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() && !imageFile) {
      toast.error('Escribe un comentario o sube una imagen');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('comment-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('comment-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const content = newComment.trim();
      const encryptedContent = content ? encryptData(content) : null;

      const { error } = await (supabase as any)
        .from('comments')
        .insert({
          secret_id: secretId,
          user_id: user?.id || null,
          content: content || '[imagen]',
          encrypted_content: encryptedContent,
          image_url: imageUrl,
          reactions: { turbio: 0, impresionante: 0, noMeGusta: 0 }
        });

      if (error) throw error;

      setNewComment('');
      setImageFile(null);
      toast.success('Comentario publicado');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Error al publicar comentario');
    } finally {
      setLoading(false);
    }
  };

  const handleReact = async (commentId: string, reaction: ReactionType) => {
    const currentReaction = userReactions[commentId];
    const comment = comments.find((c) => c.id === commentId);
    
    if (!comment) return;

    try {
      const newReactions = { ...comment.reactions };
      
      if (currentReaction) {
        newReactions[currentReaction] = Math.max(0, newReactions[currentReaction] - 1);
      }

      if (currentReaction !== reaction) {
        newReactions[reaction] = newReactions[reaction] + 1;
      }

      const { error } = await (supabase as any)
        .from('comments')
        .update({ reactions: newReactions })
        .eq('id', commentId);

      if (error) throw error;

      setUserReactions((prev) => {
        const newUserReactions = { ...prev };
        if (currentReaction === reaction) {
          delete newUserReactions[commentId];
        } else {
          newUserReactions[commentId] = reaction;
        }
        return newUserReactions;
      });
    } catch (error) {
      console.error('Error updating reaction:', error);
      toast.error('Error al actualizar la reacción');
    }
  };

  const reactions = [
    { type: 'turbio' as const, icon: Flame, label: 'Turbio', color: 'text-orange-500' },
    { type: 'impresionante' as const, icon: Star, label: 'Impresionante', color: 'text-yellow-500' },
    { type: 'noMeGusta' as const, icon: ThumbsDown, label: 'No me gusta', color: 'text-red-500' },
  ];

  return (
    <div className="mt-4 border-t border-border/30 pt-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(!showComments)}
        className="mb-4 gap-2"
      >
        <MessageCircle className="h-4 w-4" />
        {showComments ? 'Ocultar' : 'Mostrar'} comentarios ({comments.length})
      </Button>

      {showComments && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe un comentario..."
              maxLength={500}
              disabled={loading}
              className="min-h-20"
            />
            <div className="flex justify-between items-center">
              <ImageUpload
                onImageSelect={setImageFile}
                onImageRemove={() => setImageFile(null)}
                disabled={loading}
              />
              <Button onClick={handleSubmitComment} disabled={loading} size="sm">
                {loading ? 'Publicando...' : 'Comentar'}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-muted/30 rounded-lg p-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    {comment.profile ? (
                      <PixelAvatar seed={comment.profile.avatar_seed} size={40} />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-xs">
                        Anon
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {comment.profile?.username || 'Anónimo'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </span>
                    </div>
                    
                    <p className="text-sm whitespace-pre-wrap break-words mb-2">
                      {comment.content}
                    </p>
                    
                    {comment.image_url && (
                      <img 
                        src={comment.image_url} 
                        alt="Imagen del comentario" 
                        className="max-w-full rounded-lg mb-2 max-h-48 object-cover"
                      />
                    )}
                    
                    <div className="flex items-center gap-2">
                      {reactions.map(({ type, icon: Icon, label, color }) => (
                        <Button
                          key={type}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReact(comment.id, type)}
                          className={`h-7 gap-1 transition-all duration-300 ${
                            comment.userReaction === type
                              ? `${color} bg-muted scale-110`
                              : 'hover:bg-muted'
                          }`}
                          title={label}
                        >
                          <Icon className="h-3 w-3" />
                          <span className="text-xs">
                            {comment.reactions[type]}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
