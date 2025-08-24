import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Calendar, 
  Heart, 
  Target,
  Clock,
  Zap,
  Award,
  BarChart3
} from "lucide-react";

export default function Insights() {
  // Sample data - in a real app, this would come from your analytics
  const stats = {
    totalEntries: 47,
    currentStreak: 12,
    longestStreak: 23,
    wordsWritten: 12750,
    averageWordsPerEntry: 271,
    mostActiveHour: "8 AM",
    favoriteTag: "coffee",
    moodDistribution: {
      happy: 35,
      calm: 28,
      excited: 20,
      stressed: 12,
      tired: 5,
    }
  };

  const achievements = [
    { id: 1, title: "First Entry", description: "Created your first journal entry", unlocked: true },
    { id: 2, title: "Week Warrior", description: "Journaled for 7 days straight", unlocked: true },
    { id: 3, title: "Mood Master", description: "Tracked moods for 30 entries", unlocked: true },
    { id: 4, title: "Memory Keeper", description: "Saved 25 memories", unlocked: false },
  ];

  const weeklyData = [
    { day: 'Mon', entries: 2, mood: 'calm' },
    { day: 'Tue', entries: 1, mood: 'happy' },
    { day: 'Wed', entries: 3, mood: 'excited' },
    { day: 'Thu', entries: 1, mood: 'stressed' },
    { day: 'Fri', entries: 2, mood: 'happy' },
    { day: 'Sat', entries: 1, mood: 'calm' },
    { day: 'Sun', entries: 2, mood: 'peaceful' },
  ];

  return (
    <div className="min-h-screen bg-background pt-16 pb-24 md:pt-20 md:pb-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Insights</h1>
          <p className="text-muted-foreground">
            Discover patterns in your journaling journey and celebrate your progress
          </p>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Entries", value: stats.totalEntries, icon: Calendar, color: "bg-blue-500" },
            { label: "Current Streak", value: `${stats.currentStreak} days`, icon: Zap, color: "bg-orange-500" },
            { label: "Words Written", value: stats.wordsWritten.toLocaleString(), icon: Target, color: "bg-green-500" },
            { label: "Avg per Entry", value: `${stats.averageWordsPerEntry} words`, icon: BarChart3, color: "bg-purple-500" },
          ].map((stat, index) => (
            <Card 
              key={stat.label} 
              className="animate-scale-in hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Mood Distribution */}
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-primary" />
                <span>Mood Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(stats.moodDistribution).map(([mood, percentage]) => (
                <div key={mood} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="capitalize text-sm font-medium">{mood}</span>
                    <span className="text-sm text-muted-foreground">{percentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`mood-${mood} h-2 rounded-full transition-all duration-1000`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Weekly Activity */}
          <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>This Week's Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyData.map((day, index) => (
                  <div key={day.day} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium w-8">{day.day}</span>
                      <div className={`w-3 h-3 rounded-full mood-${day.mood}`} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {day.entries} {day.entries === 1 ? 'entry' : 'entries'}
                      </span>
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${(day.entries / 3) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-primary" />
              <span>Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-all ${
                    achievement.unlocked 
                      ? 'border-primary/20 bg-primary/5' 
                      : 'border-muted bg-muted/30'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    achievement.unlocked 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {achievement.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {achievement.description}
                    </p>
                  </div>
                  {achievement.unlocked && (
                    <Badge className="bg-primary text-primary-foreground">
                      Unlocked
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <CardContent className="p-6">
              <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="text-xl font-bold text-foreground mb-1">{stats.mostActiveHour}</h3>
              <p className="text-sm text-muted-foreground">Most active hour</p>
            </CardContent>
          </Card>

          <Card className="text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <CardContent className="p-6">
              <Target className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="text-xl font-bold text-foreground mb-1">{stats.longestStreak} days</h3>
              <p className="text-sm text-muted-foreground">Longest streak</p>
            </CardContent>
          </Card>

          <Card className="text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <CardContent className="p-6">
              <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="text-xl font-bold text-foreground mb-1">#{stats.favoriteTag}</h3>
              <p className="text-sm text-muted-foreground">Favorite tag</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}