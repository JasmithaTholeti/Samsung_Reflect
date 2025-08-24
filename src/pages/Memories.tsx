import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Calendar, 
  Heart, 
  Image, 
  FileText,
  Star,
  Clock
} from "lucide-react";

interface Memory {
  id: string;
  title: string;
  date: string;
  mood: string;
  preview: string;
  type: 'text' | 'image' | 'mixed';
  tags: string[];
  isFavorite: boolean;
}

const sampleMemories: Memory[] = [
  {
    id: '1',
    title: 'Morning Coffee Reflections',
    date: '2024-01-15',
    mood: 'calm',
    preview: 'Started my day with a perfect cup of coffee and watched the sunrise...',
    type: 'mixed',
    tags: ['morning', 'coffee', 'sunrise'],
    isFavorite: true,
  },
  {
    id: '2',
    title: 'Weekend Adventure',
    date: '2024-01-14',
    mood: 'excited',
    preview: 'Explored the new hiking trail with friends. The view from the top was...',
    type: 'image',
    tags: ['hiking', 'friends', 'adventure'],
    isFavorite: false,
  },
  {
    id: '3',
    title: 'Quiet Evening',
    date: '2024-01-13',
    mood: 'peaceful',
    preview: 'Spent the evening reading by the fireplace. Sometimes the simple moments...',
    type: 'text',
    tags: ['reading', 'evening', 'peaceful'],
    isFavorite: false,
  },
];

const moodColors = {
  happy: 'bg-mood-happy',
  calm: 'bg-mood-calm',
  excited: 'bg-mood-excited',
  stressed: 'bg-mood-stressed',
  tired: 'bg-mood-tired',
  peaceful: 'bg-mood-calm',
};

export default function Memories() {
  const [memories] = useState<Memory[]>(sampleMemories);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'favorites' | 'recent'>('all');

  const filteredMemories = memories.filter(memory => {
    const matchesSearch = memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         memory.preview.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'favorites') {
      return matchesSearch && memory.isFavorite;
    }
    
    return matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'text': return <FileText className="w-4 h-4" />;
      default: return <Heart className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pt-16 pb-24 md:pt-20 md:pb-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Memories</h1>
          <p className="text-muted-foreground">
            Revisit your beautiful journal entries and relive those special moments
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 animate-slide-up">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search your memories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <Button
                  variant={selectedFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={selectedFilter === 'favorites' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter('favorites')}
                >
                  <Star className="w-4 h-4 mr-1" />
                  Favorites
                </Button>
                <Button
                  variant={selectedFilter === 'recent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter('recent')}
                >
                  <Clock className="w-4 h-4 mr-1" />
                  Recent
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemories.map((memory, index) => (
            <Card 
              key={memory.id} 
              className="hover:shadow-lg transition-all duration-300 cursor-pointer group animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(memory.type)}
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {memory.title}
                    </CardTitle>
                  </div>
                  {memory.isFavorite && (
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  )}
                </div>
                
                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(memory.date).toLocaleDateString()}</span>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${moodColors[memory.mood as keyof typeof moodColors]}`} />
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {memory.preview}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {memory.tags.map(tag => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  View Memory
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredMemories.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No memories found</h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? "Try adjusting your search terms" 
                : "Start journaling to create beautiful memories"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}