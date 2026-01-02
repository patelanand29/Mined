import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import Layout from '@/components/layout/Layout';

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
  date: string;
  mood: typeof MOODS[0];
  intensity: number;
  note: string;
}

export default function MoodCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([
    { date: '2026-01-01', mood: MOODS[0], intensity: 4, note: 'Started the new year feeling great!' },
    { date: '2026-01-02', mood: MOODS[1], intensity: 3, note: 'Productive day' },
  ]);
  const [selectedMood, setSelectedMood] = useState<typeof MOODS[0] | null>(null);
  const [intensity, setIntensity] = useState([3]);
  const [note, setNote] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

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
    return moodEntries.find(entry => entry.date === dateStr);
  };

  const handleSaveMood = () => {
    if (!selectedMood) return;
    
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const newEntry: MoodEntry = {
      date: dateStr,
      mood: selectedMood,
      intensity: intensity[0],
      note: note
    };

    setMoodEntries(prev => [...prev.filter(e => e.date !== dateStr), newEntry]);
    setSelectedMood(null);
    setIntensity([3]);
    setNote('');
    setDialogOpen(false);
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
            <p className="text-muted-foreground mt-1">Track your emotional journey day by day</p>
          </div>

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
                  <label className="text-sm font-medium">Add a note (optional)</label>
                  <Textarea
                    placeholder="What's on your mind?"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                </div>

                <Button onClick={handleSaveMood} className="w-full" disabled={!selectedMood}>
                  Save Mood Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                const isToday = 
                  day === new Date().getDate() && 
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear();

                return (
                  <motion.div
                    key={day}
                    whileHover={{ scale: 1.05 }}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm cursor-pointer transition-all ${
                      isToday 
                        ? 'ring-2 ring-primary bg-primary/10' 
                        : 'bg-muted/30 hover:bg-muted/60'
                    }`}
                  >
                    <span className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                      {day}
                    </span>
                    {moodEntry && (
                      <span className="text-lg mt-0.5">{moodEntry.mood.emoji}</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Entries */}
        <div className="mt-8">
          <h2 className="font-display text-xl font-semibold mb-4">Recent Entries</h2>
          <div className="space-y-3">
            {moodEntries.slice(-5).reverse().map((entry, i) => (
              <motion.div
                key={entry.date}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="mined-card">
                  <CardContent className="flex items-center gap-4 p-4">
                    <span className="text-3xl">{entry.mood.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{entry.mood.label}</span>
                        <span className="text-xs text-muted-foreground">
                          Intensity: {entry.intensity}/5
                        </span>
                      </div>
                      {entry.note && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.note}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{entry.date}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}
