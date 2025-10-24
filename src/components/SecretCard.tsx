import { Flame, Star, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Secret, ReactionType } from '@/types/secret';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import PixelAvatar from './PixelAvatar';
import CommentSection from './CommentSection';

interface SecretCardProps {
  secret: Secret;
  onReact: (secretId: string, reaction: ReactionType) => void;
}

const SecretCard = ({ secret, onReact }: SecretCardProps) => {
  const reactions = [
    { type: 'turbio' as const, icon: Flame, label: 'Turbio', color: 'text-orange-500' },
    { type: 'impresionante' as const, icon: Star, label: 'Impresionante', color: 'text-yellow-500' },
    { type: 'noMeGusta' as const, icon: ThumbsDown, label: 'No me gusta', color: 'text-red-500' },
  ];

  const handleReaction = (type: ReactionType) => {
    onReact(secret.id, type);
  };

  return (
    <div className="card-gradient rounded-2xl p-4 sm:p-6 border border-border/50 animate-slide-up hover:scale-[1.02] transition-all duration-300">
      <div className="relative">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0">
            {secret.profile ? (
              <PixelAvatar seed={secret.profile.avatar_seed} size={40} />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-xs">
                Anon
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm mb-1">
              {secret.profile?.username || 'Anónimo'}
            </div>
            <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap break-words">
              {secret.content}
            </p>
            {secret.image_url && (
              <img 
                src={secret.image_url} 
                alt="Imagen del secreto" 
                className="mt-3 max-w-full rounded-lg max-h-96 object-cover"
              />
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-border/30">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(secret.created_at), { addSuffix: true, locale: es })}
          </span>
          
          <div className="flex items-center gap-2">
            {reactions.map(({ type, icon: Icon, label, color }) => (
              <Button
                key={type}
                variant="ghost"
                size="sm"
                onClick={() => handleReaction(type)}
                className={`rounded-full gap-1 transition-all duration-300 ${
                  secret.userReaction === type
                    ? `${color} bg-muted scale-110`
                    : 'hover:bg-muted'
                }`}
                title={label}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">
                  {secret.reactions[type]}
                </span>
              </Button>
            ))}
          </div>
        </div>

        <CommentSection secretId={secret.id} />
      </div>
    </div>
  );
};

export default SecretCard;
