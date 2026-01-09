import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, ExternalLink, BookmarkPlus, BookmarkCheck, Phone, Video, FileText, Headphones, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'helpline' | 'guide' | 'audio';
  category: string;
  url: string;
  isBookmarked?: boolean;
}

const RESOURCES: Resource[] = [
  // Helplines
  { id: '1', title: 'iCall - Psychosocial Helpline', description: 'Free counseling service by TISS. Available Mon-Sat, 8am-10pm', type: 'helpline', category: 'crisis', url: 'tel:9152987821' },
  { id: '2', title: 'Vandrevala Foundation', description: '24/7 free mental health support in multiple languages', type: 'helpline', category: 'crisis', url: 'tel:18602662345' },
  { id: '3', title: 'NIMHANS', description: 'National Institute of Mental Health helpline', type: 'helpline', category: 'crisis', url: 'tel:08046110007' },
  
  // Articles
  { id: '4', title: 'Understanding Anxiety in Students', description: 'A comprehensive guide to recognizing and managing anxiety during academic life', type: 'article', category: 'anxiety', url: 'https://www.nimh.nih.gov/health/publications/anxiety-disorders' },
  { id: '5', title: 'Dealing with Academic Pressure', description: 'Practical tips for handling exam stress and expectations', type: 'article', category: 'stress', url: 'https://www.apa.org/topics/stress' },
  { id: '6', title: 'Sleep Hygiene for Better Mental Health', description: 'How to improve your sleep patterns for emotional well-being', type: 'article', category: 'sleep', url: 'https://www.sleepfoundation.org/sleep-hygiene' },
  
  // Videos
  { id: '7', title: 'Mindfulness for Beginners - Headspace', description: '10-minute guided meditation for stress relief and daily calm', type: 'video', category: 'meditation', url: 'https://www.youtube.com/watch?v=ZToicYcHIOU' },
  { id: '8', title: 'Understanding Depression - TED Talk', description: 'Andrew Solomon shares insights on depression and finding meaning', type: 'video', category: 'depression', url: 'https://www.youtube.com/watch?v=-eBUcBfkVCo' },
  { id: '9', title: 'Box Breathing Technique', description: 'Navy SEAL breathing method for stress and anxiety relief', type: 'video', category: 'anxiety', url: 'https://www.youtube.com/watch?v=tEmt1Znux58' },
  { id: '10', title: 'How to Practice Emotional First Aid', description: 'TED Talk by Guy Winch on taking care of your emotional health', type: 'video', category: 'self-help', url: 'https://www.youtube.com/watch?v=F2hc2FLOdhI' },
  { id: '11', title: 'The Science of Gratitude', description: 'How gratitude rewires your brain for happiness', type: 'video', category: 'self-help', url: 'https://www.youtube.com/watch?v=JMd1CcGZYwU' },
  { id: '12', title: 'Body Scan Meditation - 15 Minutes', description: 'Guided body scan for relaxation and body awareness', type: 'video', category: 'meditation', url: 'https://www.youtube.com/watch?v=QS2yDmWk0vs' },
  
  // Audio Resources
  { id: '13', title: 'Calm Sleep Stories', description: 'Soothing bedtime stories narrated to help you fall asleep peacefully', type: 'audio', category: 'sleep', url: 'https://open.spotify.com/show/3j7qI7AJKH4jFxGZPP5R8n' },
  { id: '14', title: 'The Happiness Lab Podcast', description: 'Yale professor explores the science of happiness and well-being', type: 'audio', category: 'self-help', url: 'https://open.spotify.com/show/3i5TCKhc6GY42pOWkpWveG' },
  { id: '15', title: 'Meditation Minis Podcast', description: 'Short, guided meditations for stress, anxiety, and sleep', type: 'audio', category: 'meditation', url: 'https://open.spotify.com/show/2fO2kAptmSs3LOHJ7WP0eX' },
  { id: '16', title: 'Rain Sounds - 1 Hour', description: 'Natural rain sounds for relaxation, focus, and sleep', type: 'audio', category: 'sleep', url: 'https://open.spotify.com/track/2P43oPFrPNe0LzgXU2N0WC' },
  { id: '17', title: 'Lo-Fi Beats for Study', description: 'Calming lo-fi music to help you focus and reduce anxiety', type: 'audio', category: 'stress', url: 'https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn9wzrS' },
  { id: '18', title: 'Breathing Exercises Audio Guide', description: '4-7-8 breathing technique for instant calm', type: 'audio', category: 'anxiety', url: 'https://open.spotify.com/episode/3l7rL1qwU3h3MWYz7TtMmK' },
  
  // Guides
  { id: '19', title: 'CBT Workbook for Students', description: 'Self-help cognitive behavioral therapy exercises', type: 'guide', category: 'self-help', url: 'https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself' },
  { id: '20', title: 'Building Healthy Relationships', description: 'Guide to improving communication and setting boundaries', type: 'guide', category: 'relationships', url: 'https://www.psychologytoday.com/us/basics/relationships' },
];

const CATEGORIES = ['all', 'anxiety', 'depression', 'stress', 'sleep', 'meditation', 'self-help', 'relationships', 'crisis'];

export default function Resources() {
  const [resources, setResources] = useState(RESOURCES);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeType, setActiveType] = useState('all');

  const toggleBookmark = (id: string) => {
    setResources(prev => prev.map(r => 
      r.id === id ? { ...r, isBookmarked: !r.isBookmarked } : r
    ));
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || r.category === activeCategory;
    const matchesType = activeType === 'all' || r.type === activeType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return FileText;
      case 'video': return Video;
      case 'helpline': return Phone;
      case 'guide': return Headphones;
      case 'audio': return Music;
      default: return FileText;
    }
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-8 h-8 text-slate-600" />
            Resources Library
          </h1>
          <p className="text-muted-foreground mt-1">Articles, videos, podcasts, helplines & self-help guides</p>
        </div>

        {/* Emergency Banner */}
        <Card className="mined-card border-l-4 border-l-red-500 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-foreground">Need immediate help?</p>
                <p className="text-sm text-muted-foreground">
                  If you're in crisis, please reach out to a helpline immediately
                </p>
              </div>
              <Button variant="destructive" className="gap-2" asChild>
                <a href="tel:9152987821">
                  <Phone className="w-4 h-4" />
                  Call iCall: 9152987821
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={activeType} onValueChange={setActiveType}>
            <TabsList className="w-full sm:w-auto flex-wrap">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="article">Articles</TabsTrigger>
              <TabsTrigger value="video">Videos</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="helpline">Helplines</TabsTrigger>
              <TabsTrigger value="guide">Guides</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map(cat => (
              <Button
                key={cat}
                variant={activeCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className="capitalize"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.map((resource, i) => {
            const TypeIcon = getTypeIcon(resource.type);
            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="mined-card h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        resource.type === 'helpline' 
                          ? 'bg-red-500/20 text-red-600' 
                          : resource.type === 'video'
                            ? 'bg-purple-500/20 text-purple-600'
                            : resource.type === 'audio'
                              ? 'bg-emerald-500/20 text-emerald-600'
                              : resource.type === 'guide'
                                ? 'bg-teal-500/20 text-teal-600'
                                : 'bg-blue-500/20 text-blue-600'
                      }`}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-display font-semibold text-foreground line-clamp-1">
                            {resource.title}
                          </h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="flex-shrink-0"
                            onClick={() => toggleBookmark(resource.id)}
                          >
                            {resource.isBookmarked ? (
                              <BookmarkCheck className="w-4 h-4 text-primary" />
                            ) : (
                              <BookmarkPlus className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {resource.description}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs bg-muted px-2 py-1 rounded-full capitalize">
                            {resource.category}
                          </span>
                          <Button variant="ghost" size="sm" className="gap-1" asChild>
                            <a href={resource.url} target="_blank" rel="noopener noreferrer">
                              {resource.type === 'helpline' ? 'Call' : resource.type === 'audio' ? 'Listen' : 'View'}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Bookmarked Resources */}
        {resources.some(r => r.isBookmarked) && (
          <div className="mt-8">
            <h2 className="font-display text-xl font-semibold mb-4">Bookmarked</h2>
            <div className="flex flex-wrap gap-2">
              {resources.filter(r => r.isBookmarked).map(r => (
                <Button key={r.id} variant="outline" size="sm" className="gap-1">
                  <BookmarkCheck className="w-3 h-3" />
                  {r.title}
                </Button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
