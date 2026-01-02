import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Search, Filter, Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Layout from '@/components/layout/Layout';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: string;
  date: string;
  tags: string[];
}

const MOOD_OPTIONS = ['😄 Happy', '😊 Good', '😐 Neutral', '😔 Sad', '😰 Anxious'];

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([
    {
      id: '1',
      title: 'New Year Reflections',
      content: 'Today marks a new beginning. I\'ve set my intentions for the year - focusing more on mental wellness and self-care. The meditation session this morning was particularly peaceful.',
      mood: '😄 Happy',
      date: '2026-01-01',
      tags: ['reflection', 'new-year']
    },
    {
      id: '2',
      title: 'Challenging but Growing',
      content: 'Had a difficult conversation today, but I handled it better than I would have before. Progress isn\'t always linear, and that\'s okay.',
      mood: '😊 Good',
      date: '2026-01-02',
      tags: ['growth', 'challenges']
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: '', content: '', mood: '', tags: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState<string>('all');

  const handleSaveEntry = () => {
    if (!newEntry.title || !newEntry.content) return;

    const entry: JournalEntry = {
      id: Date.now().toString(),
      title: newEntry.title,
      content: newEntry.content,
      mood: newEntry.mood || '😐 Neutral',
      date: new Date().toISOString().split('T')[0],
      tags: newEntry.tags.split(',').map(t => t.trim()).filter(Boolean)
    };

    setEntries(prev => [entry, ...prev]);
    setNewEntry({ title: '', content: '', mood: '', tags: '' });
    setDialogOpen(false);
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMood = filterMood === 'all' || entry.mood === filterMood;
    return matchesSearch && matchesMood;
  });

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-cyan-600" />
              Journal
            </h1>
            <p className="text-muted-foreground mt-1">Express and reflect on your thoughts</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">Write a New Entry</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Title"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, title: e.target.value }))}
                />
                
                <Textarea
                  placeholder="What's on your mind today?"
                  value={newEntry.content}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  className="resize-none"
                />

                <Select
                  value={newEntry.mood}
                  onValueChange={(value) => setNewEntry(prev => ({ ...prev, mood: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your mood" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOOD_OPTIONS.map(mood => (
                      <SelectItem key={mood} value={mood}>{mood}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Tags (comma separated)"
                  value={newEntry.tags}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, tags: e.target.value }))}
                />

                <Button onClick={handleSaveEntry} className="w-full" disabled={!newEntry.title || !newEntry.content}>
                  Save Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterMood} onValueChange={setFilterMood}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by mood" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Moods</SelectItem>
              {MOOD_OPTIONS.map(mood => (
                <SelectItem key={mood} value={mood}>{mood}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entries List */}
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <Card className="mined-card">
              <CardContent className="py-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No journal entries yet. Start writing!</p>
              </CardContent>
            </Card>
          ) : (
            filteredEntries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="mined-card group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{entry.mood.split(' ')[0]}</span>
                          <h3 className="font-display text-lg font-semibold text-foreground">
                            {entry.title}
                          </h3>
                        </div>
                        <p className="text-muted-foreground text-sm line-clamp-3 mb-3">
                          {entry.content}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {entry.date}
                          </span>
                          {entry.tags.length > 0 && (
                            <div className="flex gap-1">
                              {entry.tags.map(tag => (
                                <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={() => handleDeleteEntry(entry.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Entries', value: entries.length },
            { label: 'This Month', value: entries.filter(e => e.date.startsWith('2026-01')).length },
            { label: 'Unique Tags', value: new Set(entries.flatMap(e => e.tags)).size },
            { label: 'Streak', value: '2 days' },
          ].map((stat) => (
            <Card key={stat.label} className="mined-card">
              <CardContent className="p-4 text-center">
                <div className="font-display text-2xl font-bold mined-text-gradient">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </Layout>
  );
}
