import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Home, 
  Heart, 
  BarChart3, 
  Settings, 
  Moon, 
  Sun, 
  Lock 
} from "lucide-react";

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const navItems = [
    { icon: Home, label: "Journal", path: "/" },
    { icon: Heart, label: "Memories", path: "/memories" },
    { icon: BarChart3, label: "Insights", path: "/insights" },
    { icon: Settings, label: "Settings", path: "/settings" }
  ];

  if (isMobile) {
    return (
      <>
        {/* Mobile Top Bar - Just App Name */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                <span className="text-white font-bold text-xs">R</span>
              </div>
              <h1 className="text-lg font-semibold text-foreground">Samsung Reflect</h1>
              <Lock className="w-3 h-3 text-muted-foreground" />
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleTheme}
              className="w-8 h-8 p-0"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </nav>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-padding-bottom">
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center space-y-1 p-3 h-auto min-w-[60px] transition-all ${
                    isActive 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                    {item.label}
                  </span>
                </Button>
              );
            })}
          </div>
        </nav>
      </>
    );
  }

  // Desktop Navigation
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">Samsung Reflect</h1>
          <Lock className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Navigation Items */}
        <div className="flex items-center space-x-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate(item.path)}
                className={`flex items-center space-x-2 ${
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-accent"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Theme Toggle */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleTheme}
          className="w-9 h-9 p-0"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>
      </div>
    </nav>
  );
};