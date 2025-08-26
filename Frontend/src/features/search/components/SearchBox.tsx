import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, X, Filter } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface SearchFilters {
  classes: string[];
  scenes: string[];
}

interface SearchBoxProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  isLoading?: boolean;
  placeholder?: string;
  availableClasses?: string[];
  availableScenes?: string[];
}

const DEFAULT_CLASSES = [
  'person', 'car', 'dog', 'cat', 'bird', 'bicycle', 'motorcycle', 
  'airplane', 'bus', 'train', 'truck', 'boat', 'traffic light',
  'fire hydrant', 'stop sign', 'parking meter', 'bench', 'chair',
  'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv',
  'laptop', 'mouse', 'remote', 'keyboard', 'cell phone', 'microwave',
  'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase',
  'scissors', 'teddy bear', 'hair drier', 'toothbrush'
];

const DEFAULT_SCENES = [
  'outdoor', 'indoor', 'natural', 'urban', 'sunset', 'sunrise',
  'night', 'beach', 'mountain', 'forest', 'city', 'park', 'garden',
  'kitchen', 'bedroom', 'living room', 'office', 'restaurant'
];

export const SearchBox: React.FC<SearchBoxProps> = ({
  onSearch,
  isLoading = false,
  placeholder = "Search for objects, scenes, or describe what you're looking for...",
  availableClasses = DEFAULT_CLASSES,
  availableScenes = DEFAULT_SCENES
}) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    classes: [],
    scenes: []
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      onSearch(query.trim(), filters);
    }
  }, [query, filters, onSearch]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClassToggle = (className: string) => {
    setFilters(prev => ({
      ...prev,
      classes: prev.classes.includes(className)
        ? prev.classes.filter(c => c !== className)
        : [...prev.classes, className]
    }));
  };

  const handleSceneToggle = (sceneName: string) => {
    setFilters(prev => ({
      ...prev,
      scenes: prev.scenes.includes(sceneName)
        ? prev.scenes.filter(s => s !== sceneName)
        : [...prev.scenes, sceneName]
    }));
  };

  const clearFilters = () => {
    setFilters({ classes: [], scenes: [] });
  };

  const hasActiveFilters = filters.classes.length > 0 || filters.scenes.length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                disabled={isLoading}
                className="pr-10"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuery('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className={hasActiveFilters ? 'bg-primary/10 border-primary' : ''}
                >
                  <Filter className="h-4 w-4" />
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full text-xs" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Search Filters</h4>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear All
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Object Classes</Label>
                    <div className="mt-2 max-h-32 overflow-y-auto space-y-2">
                      {availableClasses.map(className => (
                        <div key={className} className="flex items-center space-x-2">
                          <Checkbox
                            id={`class-${className}`}
                            checked={filters.classes.includes(className)}
                            onCheckedChange={() => handleClassToggle(className)}
                          />
                          <Label 
                            htmlFor={`class-${className}`}
                            className="text-sm capitalize cursor-pointer"
                          >
                            {className}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Scene Types</Label>
                    <div className="mt-2 max-h-32 overflow-y-auto space-y-2">
                      {availableScenes.map(sceneName => (
                        <div key={sceneName} className="flex items-center space-x-2">
                          <Checkbox
                            id={`scene-${sceneName}`}
                            checked={filters.scenes.includes(sceneName)}
                            onCheckedChange={() => handleSceneToggle(sceneName)}
                          />
                          <Label 
                            htmlFor={`scene-${sceneName}`}
                            className="text-sm capitalize cursor-pointer"
                          >
                            {sceneName}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button 
              onClick={handleSearch} 
              disabled={isLoading || !query.trim()}
              className="px-6"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.classes.map(className => (
            <Badge key={className} variant="secondary" className="gap-1">
              Class: {className}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleClassToggle(className)}
              />
            </Badge>
          ))}
          {filters.scenes.map(sceneName => (
            <Badge key={sceneName} variant="secondary" className="gap-1">
              Scene: {sceneName}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleSceneToggle(sceneName)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
