import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, BarChart3, Activity, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Layout from '@/components/layout/Layout';

const MOOD_DATA = [
  { date: 'Mon', mood: 4, emoji: '😊' },
  { date: 'Tue', mood: 3, emoji: '😐' },
  { date: 'Wed', mood: 2, emoji: '😔' },
  { date: 'Thu', mood: 3, emoji: '😐' },
  { date: 'Fri', mood: 4, emoji: '😊' },
  { date: 'Sat', mood: 5, emoji: '😄' },
  { date: 'Sun', mood: 4, emoji: '😊' },
];

const EMOTION_BREAKDOWN = [
  { emotion: 'Happy', count: 12, color: 'bg-green-500', percentage: 35 },
  { emotion: 'Calm', count: 8, color: 'bg-blue-400', percentage: 24 },
  { emotion: 'Anxious', count: 6, color: 'bg-purple-500', percentage: 18 },
  { emotion: 'Sad', count: 5, color: 'bg-indigo-500', percentage: 15 },
  { emotion: 'Angry', count: 3, color: 'bg-red-500', percentage: 8 },
];

export default function MoodTrends() {
  const [timeRange, setTimeRange] = useState('week');

  const averageMood = (MOOD_DATA.reduce((acc, d) => acc + d.mood, 0) / MOOD_DATA.length).toFixed(1);
  const moodTrend = MOOD_DATA[MOOD_DATA.length - 1].mood - MOOD_DATA[0].mood;

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-emerald-600" />
              Mood Trends
            </h1>
            <p className="text-muted-foreground mt-1">Visualize patterns and gain insights</p>
          </div>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="mined-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Average Mood</p>
              <div className="flex items-center gap-2">
                <span className="font-display text-3xl font-bold">{averageMood}</span>
                <span className="text-2xl">😊</span>
              </div>
            </CardContent>
          </Card>

          <Card className="mined-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Trend</p>
              <div className="flex items-center gap-2">
                {moodTrend > 0 ? (
                  <ArrowUp className="w-6 h-6 text-green-500" />
                ) : moodTrend < 0 ? (
                  <ArrowDown className="w-6 h-6 text-red-500" />
                ) : (
                  <Minus className="w-6 h-6 text-muted-foreground" />
                )}
                <span className={`font-display text-2xl font-bold ${
                  moodTrend > 0 ? 'text-green-500' : moodTrend < 0 ? 'text-red-500' : ''
                }`}>
                  {moodTrend > 0 ? '+' : ''}{moodTrend}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="mined-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Entries</p>
              <div className="font-display text-3xl font-bold">34</div>
            </CardContent>
          </Card>

          <Card className="mined-card">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Best Day</p>
              <div className="flex items-center gap-2">
                <span className="font-display text-xl font-bold">Saturday</span>
                <span className="text-xl">😄</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mood Graph */}
        <Card className="mined-card mb-8">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Weekly Mood Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {MOOD_DATA.map((data, i) => (
                <motion.div
                  key={data.date}
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.mood / 5) * 100}%` }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="flex-1 flex flex-col items-center"
                >
                  <span className="text-2xl mb-2">{data.emoji}</span>
                  <div 
                    className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary/50 flex-1 min-h-[20%]"
                    style={{ height: `${(data.mood / 5) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground mt-2">{data.date}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Emotion Breakdown */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="mined-card">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Emotion Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {EMOTION_BREAKDOWN.map((item, i) => (
                <motion.div
                  key={item.emotion}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="space-y-1"
                >
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.emotion}</span>
                    <span className="text-muted-foreground">{item.percentage}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }}
                      className={`h-full ${item.color} rounded-full`}
                    />
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          <Card className="mined-card">
            <CardHeader>
              <CardTitle className="font-display">Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                  💚 Positive Pattern
                </p>
                <p className="text-sm text-muted-foreground">
                  Your mood tends to improve over weekends. Consider incorporating more relaxation during weekdays.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
                  💡 Observation
                </p>
                <p className="text-sm text-muted-foreground">
                  Midweek dips are common. Try a quick meditation session on Wednesdays.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">
                  📊 Trend
                </p>
                <p className="text-sm text-muted-foreground">
                  Your overall mood has improved by 15% compared to last week. Keep up the great work!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </Layout>
  );
}
