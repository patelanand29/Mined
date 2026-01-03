import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, BarChart3, Activity, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface MoodEntry {
  id: string;
  mood_emoji: string;
  mood_label: string;
  intensity: number;
  created_at: string;
}

interface DayMood {
  date: string;
  mood: number;
  emoji: string;
}

interface EmotionBreakdown {
  emotion: string;
  count: number;
  color: string;
  percentage: number;
}

const MOOD_COLORS: Record<string, string> = {
  'Happy': 'bg-green-500',
  'Good': 'bg-emerald-400',
  'Neutral': 'bg-yellow-400',
  'Sad': 'bg-blue-400',
  'Angry': 'bg-red-500',
  'Anxious': 'bg-purple-500',
  'Crying': 'bg-indigo-500',
};

export default function MoodTrends() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('week');
  const [moodData, setMoodData] = useState<DayMood[]>([]);
  const [emotionBreakdown, setEmotionBreakdown] = useState<EmotionBreakdown[]>([]);
  const [stats, setStats] = useState({
    averageMood: 0,
    moodTrend: 0,
    totalEntries: 0,
    bestDay: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMoodData();
    }
  }, [user, timeRange]);

  const fetchMoodData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate: Date;

      // Calculate start date based on time range
      switch (timeRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const { data: entries, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process mood data for graph
      const moodMap: Record<string, { total: number; count: number; emoji: string }> = {};
      const emotionCounts: Record<string, number> = {};

      (entries || []).forEach((entry: MoodEntry) => {
        const date = new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'short' });
        
        if (!moodMap[date]) {
          moodMap[date] = { total: 0, count: 0, emoji: entry.mood_emoji };
        }
        moodMap[date].total += entry.intensity;
        moodMap[date].count += 1;
        moodMap[date].emoji = entry.mood_emoji;

        // Count emotions
        emotionCounts[entry.mood_label] = (emotionCounts[entry.mood_label] || 0) + 1;
      });

      // Convert to array for graph
      const dayMoods: DayMood[] = Object.entries(moodMap).map(([date, data]) => ({
        date,
        mood: Math.round(data.total / data.count),
        emoji: data.emoji
      }));

      // Get last 7 days for weekly view
      if (timeRange === 'week') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = now.getDay();
        const orderedDays = [];
        for (let i = 6; i >= 0; i--) {
          orderedDays.push(days[(today - i + 7) % 7]);
        }
        setMoodData(orderedDays.map(day => dayMoods.find(d => d.date === day) || { date: day, mood: 0, emoji: '😐' }));
      } else {
        setMoodData(dayMoods);
      }

      // Calculate emotion breakdown
      const totalEmotions = Object.values(emotionCounts).reduce((a, b) => a + b, 0);
      const breakdown: EmotionBreakdown[] = Object.entries(emotionCounts)
        .map(([emotion, count]) => ({
          emotion,
          count,
          color: MOOD_COLORS[emotion] || 'bg-gray-400',
          percentage: totalEmotions > 0 ? Math.round((count / totalEmotions) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setEmotionBreakdown(breakdown);

      // Calculate stats
      const moodValues = dayMoods.map(d => d.mood).filter(m => m > 0);
      const avgMood = moodValues.length > 0 
        ? (moodValues.reduce((a, b) => a + b, 0) / moodValues.length).toFixed(1)
        : '0';
      
      const trend = moodValues.length >= 2 
        ? moodValues[moodValues.length - 1] - moodValues[0]
        : 0;

      // Find best day
      const bestEntry = dayMoods.reduce((best, curr) => curr.mood > best.mood ? curr : best, { date: 'N/A', mood: 0, emoji: '' });

      setStats({
        averageMood: parseFloat(avgMood),
        moodTrend: trend,
        totalEntries: entries?.length || 0,
        bestDay: bestEntry.date
      });

    } catch (error) {
      console.error('Error fetching mood data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsights = () => {
    if (stats.totalEntries === 0) {
      return [
        { type: 'info', title: '📝 Start Tracking', text: 'Log your first mood to see insights and patterns.' }
      ];
    }

    const insights = [];
    
    if (stats.moodTrend > 0) {
      insights.push({
        type: 'positive',
        title: '💚 Positive Pattern',
        text: 'Your mood has been improving! Keep up whatever you\'re doing.'
      });
    } else if (stats.moodTrend < 0) {
      insights.push({
        type: 'warning',
        title: '💛 Check In',
        text: 'Your mood has dipped recently. Consider trying some self-care activities.'
      });
    }

    if (stats.averageMood >= 4) {
      insights.push({
        type: 'positive',
        title: '🌟 Great Week',
        text: 'Your average mood is high! You\'re doing well.'
      });
    }

    if (emotionBreakdown.length > 0 && emotionBreakdown[0].emotion === 'Anxious') {
      insights.push({
        type: 'tip',
        title: '🧘 Tip',
        text: 'Anxiety seems common. Try the breathing exercises in the Meditation section.'
      });
    }

    if (insights.length === 0) {
      insights.push({
        type: 'info',
        title: '📊 Trend',
        text: `You've logged ${stats.totalEntries} entries. Keep tracking to see more patterns!`
      });
    }

    return insights;
  };

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

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="mined-card">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Average Mood</p>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-3xl font-bold">{stats.averageMood || '-'}</span>
                    <span className="text-2xl">
                      {stats.averageMood >= 4 ? '😊' : stats.averageMood >= 3 ? '😐' : stats.averageMood > 0 ? '😔' : '-'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="mined-card">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Trend</p>
                  <div className="flex items-center gap-2">
                    {stats.moodTrend > 0 ? (
                      <ArrowUp className="w-6 h-6 text-green-500" />
                    ) : stats.moodTrend < 0 ? (
                      <ArrowDown className="w-6 h-6 text-red-500" />
                    ) : (
                      <Minus className="w-6 h-6 text-muted-foreground" />
                    )}
                    <span className={`font-display text-2xl font-bold ${
                      stats.moodTrend > 0 ? 'text-green-500' : stats.moodTrend < 0 ? 'text-red-500' : ''
                    }`}>
                      {stats.moodTrend > 0 ? '+' : ''}{stats.moodTrend}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="mined-card">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Entries</p>
                  <div className="font-display text-3xl font-bold">{stats.totalEntries}</div>
                </CardContent>
              </Card>

              <Card className="mined-card">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">Best Day</p>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xl font-bold">{stats.bestDay}</span>
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
                  {timeRange === 'week' ? 'Weekly' : timeRange === 'month' ? 'Monthly' : 'Yearly'} Mood Flow
                </CardTitle>
              </CardHeader>
              <CardContent>
                {moodData.length > 0 && moodData.some(d => d.mood > 0) ? (
                  <div className="h-64 flex items-end justify-between gap-2">
                    {moodData.map((data, i) => (
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
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No mood data for this period. Start logging!
                  </div>
                )}
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
                  {emotionBreakdown.length > 0 ? (
                    emotionBreakdown.map((item, i) => (
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
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No emotion data yet
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="mined-card">
                <CardHeader>
                  <CardTitle className="font-display">Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {getInsights().map((insight, i) => (
                    <div 
                      key={i}
                      className={`p-4 rounded-lg border ${
                        insight.type === 'positive' 
                          ? 'bg-green-500/10 border-green-500/20' 
                          : insight.type === 'warning'
                          ? 'bg-amber-500/10 border-amber-500/20'
                          : 'bg-blue-500/10 border-blue-500/20'
                      }`}
                    >
                      <p className={`text-sm font-medium mb-1 ${
                        insight.type === 'positive' 
                          ? 'text-green-700 dark:text-green-400'
                          : insight.type === 'warning'
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-blue-700 dark:text-blue-400'
                      }`}>
                        {insight.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {insight.text}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </motion.div>
    </Layout>
  );
}
