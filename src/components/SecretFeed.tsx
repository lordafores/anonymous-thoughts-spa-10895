import { Secret, ReactionType } from '@/types/secret';
import SecretCard from './SecretCard';

interface SecretFeedProps {
  secrets: Secret[];
  onReact: (secretId: string, reaction: ReactionType) => void;
}

const SecretFeed = ({ secrets, onReact }: SecretFeedProps) => {
  if (secrets.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="card-gradient rounded-2xl p-12 border border-border/50">
          <p className="text-muted-foreground text-lg">
            No hay secretos todavía...
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            ¡Sé el primero en compartir algo!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-6">
      {secrets.map((secret) => (
        <SecretCard
          key={secret.id}
          secret={secret}
          onReact={onReact}
        />
      ))}
    </div>
  );
};

export default SecretFeed;
