import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl font-bold text-white">404</span>
        </div>
        <h1 className="text-4xl font-bold mb-4 text-foreground">Page Not Found</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-md">
          Oops! The page you're looking for seems to have wandered off. 
          Let's get you back to your journal.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => window.history.back()}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </Button>
          <Button 
            onClick={() => window.location.href = "/"}
            className="flex items-center space-x-2 bg-primary hover:bg-primary/90"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
