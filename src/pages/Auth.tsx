import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const { error } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Credenciales inválidas');
        } else if (error.message.includes('User already registered')) {
          toast.error('Este email ya está registrado');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success(isLogin ? 'Sesión iniciada' : 'Cuenta creada exitosamente');
        if (!isLogin) {
          toast.info('Se te asignó un nombre de usuario y avatar aleatorio. Puedes cambiarlos en tu perfil.');
        }
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div 
            className="absolute inset-0 opacity-50"
            style={{ background: 'var(--gradient-glow)' }}
          />
        </div>

        <Card className="w-full max-w-md p-6 sm:p-8 card-gradient border-border/50 relative z-10">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">LOVISEC</h1>
            <p className="text-muted-foreground">
              {isLogin ? 'Inicia sesión para continuar' : 'Crea una cuenta anónima'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                minLength={6}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Procesando...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
              disabled={loading}
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>

          <div className="mt-6 text-xs text-muted-foreground text-center">
            <p>Al registrarte, obtendrás un nombre de usuario y avatar aleatorio.</p>
            <p>Puedes personalizarlos después en tu perfil.</p>
          </div>
        </Card>
      </div>
    </ThemeProvider>
  );
};

export default Auth;
