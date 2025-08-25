import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface MoodTrackerProps {
  onClose: () => void;
}

type Mood = 'happy' | 'calm' | 'excited' | 'stressed' | 'tired';

const moodConfig = {
  happy: { emoji: '😊', label: 'Happy', color: 'mood-happy' },
  calm: { emoji: '😌', label: 'Calm', color: 'mood-calm' },
  excited: { emoji: '🤩', label: 'Excited', color: 'mood-excited' },
  stressed: { emoji: '😰', label: 'Stressed', color: 'mood-stressed' },
  tired: { emoji: '😴', label: 'Tired', color: 'mood-tired' },
};

export const MoodTracker = ({ onClose }: MoodTrackerProps) => {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);

  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood);
    // Here you would typically save the mood to your data store
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <Card className="w-72 shadow-lg animate-scale-in">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium">How are you feeling?</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(moodConfig).map(([mood, config]) => (
            <Button
              key={mood}
              variant={selectedMood === mood ? "default" : "outline"}
              onClick={() => handleMoodSelect(mood as Mood)}
              className={`flex flex-col items-center space-y-1 h-auto py-3 transition-all ${
                selectedMood === mood 
                  ? `bg-${config.color} text-white border-${config.color}` 
                  : "hover:bg-accent"
              }`}
            >
              <span className="text-2xl">{config.emoji}</span>
              <span className="text-xs font-medium">{config.label}</span>
            </Button>
          ))}
        </div>

        {selectedMood && (
          <div className="text-center animate-fade-in">
            <p className="text-sm text-muted-foreground">
              Feeling {moodConfig[selectedMood].label.toLowerCase()} today ✨
            </p>
          </div>
        )}

        {/* Quick Mood Insights */}
        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground text-center">
            Track your emotional patterns over time in the Insights section
          </p>
        </div>
      </CardContent>
    </Card>
  );
};