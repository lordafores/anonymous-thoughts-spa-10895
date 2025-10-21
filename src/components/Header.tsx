import { Sun, Moon, Terminal } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

const Header = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'matrix' as const, icon: Terminal, label: 'Matrix' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 backdrop-blur-xl bg-background/80">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            LOVISEC
          </div>
          <div className="hidden sm:block text-xs text-muted-foreground">
            Tus secretos, tu espacio
          </div>
        </div>

        <div className="flex items-center gap-2">
          {themes.map(({ value, icon: Icon, label }) => (
            <Button
              key={value}
              variant="ghost"
              size="icon"
              onClick={() => setTheme(value)}
              className={`rounded-full transition-all duration-300 ${
                theme === value
                  ? 'bg-primary text-primary-foreground glow-effect scale-110'
                  : 'hover:bg-muted'
              }`}
              aria-label={`Switch to ${label} theme`}
              title={label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;
