import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Mic, 
  Music, 
  Video, 
  Camera, 
  Upload,
  Palette,
  Sparkles,
  ChevronUp,
  ChevronDown 
} from "lucide-react";

export const MediaControls = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const mediaButtons = [
    { icon: Mic, label: "Voice Memo", color: "bg-red-500 hover:bg-red-600" },
    { icon: Music, label: "Add Music", color: "bg-purple-500 hover:bg-purple-600" },
    { icon: Video, label: "Add Video", color: "bg-blue-500 hover:bg-blue-600" },
    { icon: Camera, label: "Take Photo", color: "bg-green-500 hover:bg-green-600" },
    { icon: Upload, label: "Upload File", color: "bg-orange-500 hover:bg-orange-600" },
    { icon: Palette, label: "Change Theme", color: "bg-pink-500 hover:bg-pink-600" },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 hidden md:block">
      <Card className="bg-card/80 backdrop-blur-md border shadow-lg animate-slide-up">
        <CardContent className="p-2">
          {/* Expand/Collapse Button */}
          <div className="flex justify-center mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-16 p-0 text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* AI Suggestion Chip */}
          {!isExpanded && (
            <div className="flex justify-center mb-2">
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs flex items-center space-x-1 animate-pulse-glow">
                <Sparkles className="w-3 h-3" />
                <span>Add a photo of your coffee ☕</span>
              </div>
            </div>
          )}

          {/* Media Controls */}
          <div className={`grid transition-all duration-300 ${
            isExpanded 
              ? "grid-cols-3 md:grid-cols-6 gap-2 opacity-100" 
              : "grid-cols-2 gap-1 opacity-60"
          }`}>
            {mediaButtons.slice(0, isExpanded ? 6 : 2).map((button, index) => (
              <Button
                key={button.label}
                variant="secondary"
                size="sm"
                className={`flex flex-col items-center space-y-1 h-auto py-2 px-2 transition-all ${
                  button.color
                } text-white border-none shadow-soft hover:shadow-lg hover:scale-105`}
              >
                <button.icon className="w-4 h-4" />
                <span className="text-xs font-medium">{button.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};