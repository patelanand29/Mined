import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Sparkles, ExternalLink, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useGoogleCalendar, GoogleCalendarEvent } from '@/hooks/useGoogleCalendar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MOODS = [
  { emoji: '😄', label: 'Happy', color: 'bg-green-500' },
  { emoji: '😊', label: 'Good', color: 'bg-emerald-400' },
  { emoji: '😐', label: 'Neutral', color: 'bg-yellow-400' },
  { emoji: '😔', label: 'Sad', color: 'bg-blue-400' },
  { emoji: '😠', label: 'Angry', color: 'bg-red-500' },
  { emoji: '😰', label: 'Anxious', color: 'bg-purple-500' },
  { emoji: '😭', label: 'Crying', color: 'bg-indigo-500' },
];

interface MoodEntry {
  id: string;
  mood_emoji: string;
  mood_label: string;
  intensity: number;
  note: string | null;
  ai_insight: string | null;
  ai_emotion: string | null;
  ai_intensity: string | null;
  created_at: string;
}

export default function MoodCalendar() {
  const { user } = useAuth();
  const { isConnected, isLoading: calendarLoading, events, fetchEvents, createMoodEvent, connectGoogleCalendar } = useGoogleCalendar();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);
  const [selectedMood, setSelectedMood] = useState<typeof MOODS[0] | null>(null);
  const [intensity, setIntensity] = useState([3]);
  const [note, setNote] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiInsight, setAiInsight] = useState<{ emotion: string; intensity: string; insight: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMoodEntries();
    }
  }, [user, currentDate]);

  useEffect(() => {
    if (isConnected) {
      loadCalendarEvents();
    }
  }, [isConnected, currentDate]);

  const loadCalendarEvents = async () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const fetchedEvents = await fetchEvents(
      startOfMonth.toISOString(),
      endOfMonth.toISOString()
    );
    setCalendarEvents(fetchedEvents);
  };

  const fetchMoodEntries = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMoodEntries(data || []);
    } catch (error) {
      console.error('Error fetching mood entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getMoodForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return moodEntries.find(entry => entry.created_at.startsWith(dateStr));
  };

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return calendarEvents.filter(event => {
      const eventDate = event.start.date || event.start.dateTime?.split('T')[0];
      return eventDate === dateStr;
    });
  };

  const getAIInsight = async (text: string) => {
    if (!text.trim()) return null;
    
    try {
      const response = await supabase.functions.invoke('analyze-emotion', {
        body: { text, type: 'mood-analysis' }
      });

      if (response.error) throw response.error;
      return response.data;
    } catch (error) {
      console.error('Error getting AI insight:', error);
      return null;
    }
  };

  const handleSaveMood = async () => {
    if (!selectedMood || !user) {
      if (!user) toast.error('Please sign in to log your mood');
      return;
    }
    
    setSaving(true);
    
    try {
      // Get AI insight if there's a note
      let aiData = null;
      if (note.trim()) {
        aiData = await getAIInsight(note);
        if (aiData) {
          setAiInsight(aiData);
        }
      }

      // Save to database
      const { error } = await supabase
        .from('mood_entries')
        .insert({
          user_id: user.id,
          mood_emoji: selectedMood.emoji,
          mood_label: selectedMood.label,
          intensity: intensity[0],
          note: note || null,
          ai_insight: aiData?.insight || null,
          ai_emotion: aiData?.emotion || null,
          ai_intensity: aiData?.intensity || null
        });

      if (error) throw error;

      // Also create event in Google Calendar if connected
      if (isConnected) {
        await createMoodEvent({
          emoji: selectedMood.emoji,
          label: selectedMood.label,
          intensity: intensity[0],
          note: note || undefined
        });
      }

      toast.success('Mood logged successfully! 🌟');
      setSelectedMood(null);
      setIntensity([3]);
      setNote('');
      setDialogOpen(false);
      setAiInsight(null);
      fetchMoodEntries();
      if (isConnected) loadCalendarEvents();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save mood');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectCalendar = async () => {
    await connectGoogleCalendar();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCalendarEvents();
    setRefreshing(false);
    toast.success('Calendar refreshed!');
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="w-8 h-8 text-primary" />
              Mood Calendar
            </h1>
            <p className="text-muted-foreground mt-1">
              {isConnected ? 'Synced with Google Calendar' : 'Connect Google Calendar for full sync'}
            </p>
          </div>

          <div className="flex gap-2">
            {isConnected ? (
              <>
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  Connected
                </div>
              </>
            ) : (
              <Button variant="outline" onClick={handleConnectCalendar} disabled={calendarLoading}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Connect Google Calendar
              </Button>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Log Today's Mood
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display">How are you feeling today?</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  {/* Mood Selection */}
                  <div className="grid grid-cols-7 gap-2">
                    {MOODS.map((mood) => (
                      <button
                        key={mood.label}
                        onClick={() => setSelectedMood(mood)}
                        className={`p-3 rounded-xl text-2xl transition-all ${
                          selectedMood?.label === mood.label
                            ? 'bg-primary/20 ring-2 ring-primary scale-110'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {mood.emoji}
                      </button>
                    ))}
                  </div>

                  {selectedMood && (
                    <p className="text-center text-muted-foreground">
                      Feeling: <span className="font-medium text-foreground">{selectedMood.label}</span>
                    </p>
                  )}

                  {/* Intensity Slider */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Intensity: {intensity[0]}/5</label>
                    <Slider
                      value={intensity}
                      onValueChange={setIntensity}
                      max={5}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Note */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      Add a note (optional)
                      <span className="text-xs text-primary flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI will provide insights
                      </span>
                    </label>
                    <Textarea
                      placeholder="What's on your mind? Describe your feelings..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="resize-none"
                      rows={3}
                    />
                  </div>

                  {/* AI Insight Preview */}
                  {aiInsight && (
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="text-sm font-medium text-primary mb-1 flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />
                        AI Insight
                      </p>
                      <p className="text-sm text-muted-foreground">{aiInsight.insight}</p>
                      <div className="flex gap-2 mt-2 text-xs">
                        <span className="bg-muted px-2 py-1 rounded">{aiInsight.emotion}</span>
                        <span className="bg-muted px-2 py-1 rounded">{aiInsight.intensity} intensity</span>
                      </div>
                    </div>
                  )}

                  {isConnected && (
                    <p className="text-xs text-muted-foreground text-center">
                      ✓ This mood will also be added to your Google Calendar
                    </p>
                  )}

                  <Button onClick={handleSaveMood} className="w-full" disabled={!selectedMood || saving}>
                    {saving ? 'Saving...' : 'Save Mood Entry'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Calendar Card */}
        <Card className="mined-card">
          <CardHeader className="flex-row items-center justify-between pb-4">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="font-display text-xl">{monthName}</CardTitle>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent>
            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {days.map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before the first day of month */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              
              {/* Days of the month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const moodEntry = getMoodForDate(day);
                const dayEvents = getEventsForDate(day);
                const isToday = 
                  day === new Date().getDate() && 
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear();

                return (
                  <motion.div
                    key={day}
                    whileHover={{ scale: 1.05 }}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm cursor-pointer transition-all relative ${
                      isToday 
                        ? 'ring-2 ring-primary bg-primary/10' 
                        : 'bg-muted/30 hover:bg-muted/60'
                    }`}
                    title={dayEvents.map(e => e.summary).join(', ')}
                  >
                    <span className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                      {day}
                    </span>
                    {moodEntry && (
                      <span className="text-lg mt-0.5">{moodEntry.mood_emoji}</span>
                    )}
                    {dayEvents.length > 0 && (
                      <div className="absolute bottom-1 flex gap-0.5">
                        {dayEvents.slice(0, 3).map((_, idx) => (
                          <div key={idx} className="w-1 h-1 rounded-full bg-primary" />
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Legend */}
            {isConnected && (
              <div className="mt-4 pt-4 border-t flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Google Calendar Event
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-base">😊</span>
                  Mood Entry
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Google Calendar Events */}
        {isConnected && calendarEvents.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display text-xl font-semibold mb-4">Upcoming Events</h2>
            <div className="space-y-2">
              {calendarEvents.slice(0, 5).map((event) => (
                <Card key={event.id} className="mined-card">
                  <CardContent className="flex items-center gap-4 p-4">
                    <CalendarDays className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{event.summary}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.start.date || new Date(event.start.dateTime!).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent Entries */}
        <div className="mt-8">
          <h2 className="font-display text-xl font-semibold mb-4">Recent Mood Entries</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : moodEntries.length === 0 ? (
            <Card className="mined-card">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No mood entries yet. Start logging!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {moodEntries.slice(0, 5).map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="mined-card">
                    <CardContent className="flex items-start gap-4 p-4">
                      <span className="text-3xl">{entry.mood_emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{entry.mood_label}</span>
                          <span className="text-xs text-muted-foreground">
                            Intensity: {entry.intensity}/5
                          </span>
                        </div>
                        {entry.note && (
                          <p className="text-sm text-muted-foreground mt-1">{entry.note}</p>
                        )}
                        {entry.ai_insight && (
                          <div className="mt-2 p-2 rounded bg-primary/10 text-xs">
                            <span className="font-medium text-primary flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              AI: {entry.ai_emotion} ({entry.ai_intensity})
                            </span>
                            <p className="text-muted-foreground mt-1">{entry.ai_insight}</p>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </Layout>
  );
}
