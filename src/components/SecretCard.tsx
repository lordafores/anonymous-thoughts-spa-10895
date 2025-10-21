import { Flame, Star, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Secret, ReactionType } from '@/types/secret';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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
    <div className="card-gradient rounded-2xl p-6 border border-border/50 animate-slide-up hover:scale-[1.02] transition-all duration-300">
      <div className="relative">
        <p className="text-foreground leading-relaxed whitespace-pre-wrap mb-4">
          {secret.content}
        </p>
        
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
      </div>
    </div>
  );
};

export default SecretCard;
