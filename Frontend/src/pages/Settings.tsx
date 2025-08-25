import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Shield, 
  Download, 
  Trash2, 
  MessageSquare, 
  Lock,
  Cloud,
  Smartphone,
  Moon,
  Palette,
  Globe,
  Key
} from "lucide-react";

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: {
      dailyReminders: true,
      moodTracking: false,
      weeklyInsights: true,
      achievementAlerts: true,
    },
    privacy: {
      autoBackup: true,
      encryptEntries: true,
      shareAnalytics: false,
      biometricLock: false,
    },
    preferences: {
      darkMode: false,
      autoSave: true,
      smartSuggestions: true,
      voiceToText: true,
    }
  });

  const updateSetting = (category: string, setting: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value
      }
    }));
  };

  const settingSections = [
    {
      title: "Notifications",
      icon: Bell,
      description: "Manage when and how you receive notifications",
      settings: [
        { key: 'dailyReminders', label: 'Daily Journal Reminders', description: 'Get reminded to write in your journal' },
        { key: 'moodTracking', label: 'Mood Check-ins', description: 'Periodic mood tracking prompts' },
        { key: 'weeklyInsights', label: 'Weekly Insights', description: 'Summary of your journaling patterns' },
        { key: 'achievementAlerts', label: 'Achievement Notifications', description: 'Celebrate your milestones' },
      ],
      category: 'notifications'
    },
    {
      title: "Privacy & Security",
      icon: Shield,
      description: "Control your data and privacy settings",
      settings: [
        { key: 'autoBackup', label: 'Auto Backup', description: 'Automatically backup your entries to the cloud' },
        { key: 'encryptEntries', label: 'Encrypt Entries', description: 'Add an extra layer of security to your data' },
        { key: 'shareAnalytics', label: 'Share Anonymous Analytics', description: 'Help improve the app with usage data' },
        { key: 'biometricLock', label: 'Biometric Lock', description: 'Use fingerprint or face unlock' },
      ],
      category: 'privacy'
    },
    {
      title: "Preferences",
      icon: Palette,
      description: "Customize your journaling experience",
      settings: [
        { key: 'darkMode', label: 'Dark Mode', description: 'Use dark theme for comfortable nighttime journaling' },
        { key: 'autoSave', label: 'Auto-save', description: 'Automatically save your entries as you type' },
        { key: 'smartSuggestions', label: 'Smart Suggestions', description: 'AI-powered writing prompts and suggestions' },
        { key: 'voiceToText', label: 'Voice to Text', description: 'Convert voice recordings to text automatically' },
      ],
      category: 'preferences'
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-16 pb-24 md:pt-20 md:pb-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Customize Samsung Reflect to match your journaling style and preferences
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingSections.map((section, sectionIndex) => (
            <Card key={section.title} className="animate-slide-up" style={{ animationDelay: `${sectionIndex * 0.1}s` }}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{section.title}</h3>
                    <p className="text-sm text-muted-foreground font-normal">{section.description}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.settings.map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                    <div className="space-y-1">
                      <Label htmlFor={`${section.category}-${setting.key}`} className="text-sm font-medium cursor-pointer">
                        {setting.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>
                    <Switch
                      id={`${section.category}-${setting.key}`}
                      checked={settings[section.category as keyof typeof settings][setting.key as keyof typeof settings.notifications]}
                      onCheckedChange={(value) => updateSetting(section.category, setting.key, value)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Data Management */}
        <Card className="mt-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Cloud className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Data Management</h3>
                <p className="text-sm text-muted-foreground font-normal">Export, backup, or clear your data</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="flex items-center space-x-2 h-auto py-4 flex-col">
                <Download className="w-5 h-5 text-primary" />
                <div className="text-center">
                  <p className="font-medium">Export Data</p>
                  <p className="text-xs text-muted-foreground">Download all your entries</p>
                </div>
              </Button>

              <Button variant="outline" className="flex items-center space-x-2 h-auto py-4 flex-col">
                <Cloud className="w-5 h-5 text-primary" />
                <div className="text-center">
                  <p className="font-medium">Backup Now</p>
                  <p className="text-xs text-muted-foreground">Create manual backup</p>
                </div>
              </Button>

              <Button variant="outline" className="flex items-center space-x-2 h-auto py-4 flex-col text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                <Trash2 className="w-5 h-5" />
                <div className="text-center">
                  <p className="font-medium">Clear Data</p>
                  <p className="text-xs opacity-70">Delete all entries</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account & Support */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-primary" />
                <span>Account</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Storage Used</span>
                <Badge variant="secondary">2.3 GB / 5 GB</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Premium Plan</span>
                <Badge className="bg-primary text-primary-foreground">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Sync Status</span>
                <Badge variant="outline" className="text-green-600 border-green-600">Connected</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <span>Support</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Globe className="w-4 h-4 mr-2" />
                Help Center
              </Button>
              <div className="text-xs text-muted-foreground text-center pt-2">
                Version 1.0.0
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}