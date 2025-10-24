import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import ImageUpload from './ImageUpload';

interface SecretInputProps {
  onSubmit: (content: string, imageFile?: File | null) => void;
}

const SecretInput = ({ onSubmit }: SecretInputProps) => {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && !imageFile) {
      toast.error('Escribe algo o sube una imagen antes de publicar');
      return;
    }

    if (content.length > 500) {
      toast.error('Tu secreto es muy largo (máx. 500 caracteres)');
      return;
    }

    onSubmit(content.trim(), imageFile);
    setContent('');
    setImageFile(null);
    toast.success('¡Secreto publicado!');
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative card-gradient rounded-2xl p-6 border border-border/50">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none" />
          
          <label htmlFor="secret-input" className="block text-sm font-medium mb-3 text-foreground">
            Comparte un pensamiento secreto
          </label>
          
          <Textarea
            id="secret-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="¿Qué secreto guardas hoy?"
            className="min-h-[120px] resize-none bg-background/50 border-border/50 focus:border-primary transition-all duration-300 text-base"
            maxLength={500}
          />
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {content.length}/500 caracteres
              </span>
              <ImageUpload
                onImageSelect={setImageFile}
                onImageRemove={() => setImageFile(null)}
              />
            </div>
            
            <Button
              type="submit"
              className="rounded-full px-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all duration-300 glow-effect"
            >
              Publicar
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SecretInput;
