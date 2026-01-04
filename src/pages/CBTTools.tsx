import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, ChevronRight, Check, RotateCcw, BookOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const COGNITIVE_DISTORTIONS = [
  { id: 'catastrophizing', label: 'Catastrophizing', desc: 'Expecting the worst possible outcome' },
  { id: 'mind-reading', label: 'Mind Reading', desc: 'Assuming you know what others think' },
  { id: 'black-white', label: 'Black & White Thinking', desc: 'Seeing things as all good or all bad' },
  { id: 'overgeneralization', label: 'Overgeneralization', desc: 'Making broad conclusions from one event' },
  { id: 'should-statements', label: 'Should Statements', desc: 'Rigid rules about how things should be' },
  { id: 'emotional-reasoning', label: 'Emotional Reasoning', desc: 'Believing feelings are facts' },
  { id: 'personalization', label: 'Personalization', desc: 'Taking excessive responsibility' },
  { id: 'filtering', label: 'Mental Filtering', desc: 'Focusing only on negatives' },
];

interface ThoughtRecord {
  id?: string;
  situation: string;
  automaticThought: string;
  emotion: string;
  distortions: string[];
  reframedThought: string;
  newEmotion: string;
}

interface SavedRecord {
  id: string;
  situation: string;
  automatic_thought: string;
  emotion: string | null;
  distortions: string[] | null;
  reframed_thought: string | null;
  new_emotion: string | null;
  created_at: string;
}

export default function CBTTools() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'record' | 'distortions' | 'reframe'>('record');
  const [record, setRecord] = useState<Partial<ThoughtRecord>>({
    distortions: []
  });
  const [savedRecords, setSavedRecords] = useState<SavedRecord[]>([]);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [quickReframe, setQuickReframe] = useState({ negative: '', reframed: '' });

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('cbt_records')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedRecords(data || []);
    } catch (error) {
      console.error('Error fetching CBT records:', error);
    }
  };

  const handleDistortionToggle = (id: string) => {
    setRecord(prev => ({
      ...prev,
      distortions: prev.distortions?.includes(id)
        ? prev.distortions.filter(d => d !== id)
        : [...(prev.distortions || []), id]
    }));
  };

  const handleSave = async () => {
    if (!record.situation || !record.automaticThought || !user) {
      if (!user) toast.error('Please sign in to save records');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('cbt_records')
        .insert({
          user_id: user.id,
          situation: record.situation,
          automatic_thought: record.automaticThought,
          emotion: record.emotion || null,
          distortions: record.distortions || [],
          reframed_thought: record.reframedThought || null,
          new_emotion: record.newEmotion || null
        });

      if (error) throw error;

      toast.success('Thought record saved! 💭');
      setRecord({ distortions: [] });
      setStep(1);
      fetchRecords();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQuickReframe = async () => {
    if (!quickReframe.negative || !quickReframe.reframed || !user) {
      if (!user) toast.error('Please sign in to save');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('cbt_records')
        .insert({
          user_id: user.id,
          situation: 'Quick Reframe Exercise',
          automatic_thought: quickReframe.negative,
          reframed_thought: quickReframe.reframed,
          distortions: []
        });

      if (error) throw error;

      toast.success('Reframe saved! 🔄');
      setQuickReframe({ negative: '', reframed: '' });
      fetchRecords();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save reframe');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cbt_records')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Record deleted');
      setSavedRecords(prev => prev.filter(r => r.id !== id));
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete record');
    }
  };

  const tools = [
    {
      id: 'record',
      title: 'Thought Record',
      desc: 'Document and analyze your thoughts',
      icon: BookOpen,
      color: 'from-rose-500/20 to-pink-500/20',
      iconColor: 'text-rose-600'
    },
    {
      id: 'distortions',
      title: 'Cognitive Distortions',
      desc: 'Identify thinking patterns',
      icon: Heart,
      color: 'from-purple-500/20 to-violet-500/20',
      iconColor: 'text-purple-600'
    },
    {
      id: 'reframe',
      title: 'Reframing Exercise',
      desc: 'Transform negative thoughts',
      icon: RotateCcw,
      color: 'from-teal-500/20 to-emerald-500/20',
      iconColor: 'text-teal-600'
    },
  ];

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 mb-4">
            <Heart className="w-8 h-8 text-rose-600" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            CBT Tools
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Evidence-based cognitive behavioral therapy techniques to help you understand and manage your thoughts
          </p>
        </div>

        {/* Tool Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card
                key={tool.id}
                className={`mined-card cursor-pointer transition-all ${
                  activeTab === tool.id ? 'ring-2 ring-primary' : 'hover:shadow-lg'
                }`}
                onClick={() => setActiveTab(tool.id as any)}
              >
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${tool.iconColor}`} />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-1">{tool.title}</h3>
                  <p className="text-xs text-muted-foreground">{tool.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Thought Record Tool */}
        {activeTab === 'record' && (
          <Card className="mined-card">
            <CardHeader>
              <CardTitle className="font-display">Thought Record</CardTitle>
              <p className="text-sm text-muted-foreground">
                Step {step} of 5: {
                  step === 1 ? 'Describe the Situation' :
                  step === 2 ? 'Identify Automatic Thought' :
                  step === 3 ? 'Name Your Emotion' :
                  step === 4 ? 'Identify Distortions' :
                  'Reframe Your Thought'
                }
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress */}
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <div
                    key={s}
                    className={`h-2 flex-1 rounded-full transition-all ${
                      s <= step ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>

              {step === 1 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">What happened?</label>
                  <Textarea
                    placeholder="Describe the situation that triggered your thoughts..."
                    value={record.situation || ''}
                    onChange={(e) => setRecord(prev => ({ ...prev, situation: e.target.value }))}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">What thought came to mind?</label>
                  <Textarea
                    placeholder="Write down the automatic thought you had..."
                    value={record.automaticThought || ''}
                    onChange={(e) => setRecord(prev => ({ ...prev, automaticThought: e.target.value }))}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">How did it make you feel?</label>
                  <Textarea
                    placeholder="Name the emotion and rate its intensity (1-10)..."
                    value={record.emotion || ''}
                    onChange={(e) => setRecord(prev => ({ ...prev, emotion: e.target.value }))}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Identify any cognitive distortions</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {COGNITIVE_DISTORTIONS.map(distortion => (
                      <div
                        key={distortion.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          record.distortions?.includes(distortion.id)
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleDistortionToggle(distortion.id)}
                      >
                        <div className="flex items-start gap-2">
                          <Checkbox checked={record.distortions?.includes(distortion.id)} />
                          <div>
                            <p className="font-medium text-sm">{distortion.label}</p>
                            <p className="text-xs text-muted-foreground">{distortion.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Reframe the thought</label>
                  <Textarea
                    placeholder="Write a more balanced, realistic thought..."
                    value={record.reframedThought || ''}
                    onChange={(e) => setRecord(prev => ({ ...prev, reframedThought: e.target.value }))}
                    rows={4}
                    className="resize-none"
                  />
                  <Textarea
                    placeholder="How do you feel now? (emotion and intensity)"
                    value={record.newEmotion || ''}
                    onChange={(e) => setRecord(prev => ({ ...prev, newEmotion: e.target.value }))}
                    rows={2}
                    className="resize-none"
                  />
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(s => Math.max(1, s - 1))}
                  disabled={step === 1}
                >
                  Back
                </Button>
                {step < 5 ? (
                  <Button onClick={() => setStep(s => s + 1)} className="gap-2">
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSave} className="gap-2" disabled={saving}>
                    <Check className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Record'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Distortions Reference */}
        {activeTab === 'distortions' && (
          <Card className="mined-card">
            <CardHeader>
              <CardTitle className="font-display">Cognitive Distortions Reference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {COGNITIVE_DISTORTIONS.map((distortion, i) => (
                <motion.div
                  key={distortion.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-lg bg-muted/50"
                >
                  <h4 className="font-semibold text-foreground mb-1">{distortion.label}</h4>
                  <p className="text-sm text-muted-foreground">{distortion.desc}</p>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Reframe */}
        {activeTab === 'reframe' && (
          <Card className="mined-card">
            <CardHeader>
              <CardTitle className="font-display">Quick Reframing Exercise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium">Negative thought</label>
                <Textarea
                  placeholder="Write the negative thought you want to reframe..."
                  rows={3}
                  className="resize-none"
                  value={quickReframe.negative}
                  onChange={(e) => setQuickReframe(prev => ({ ...prev, negative: e.target.value }))}
                />
              </div>

              <div className="p-4 rounded-lg bg-primary/10">
                <h4 className="font-medium mb-2">Reframing Questions</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• What evidence supports this thought?</li>
                  <li>• What evidence contradicts it?</li>
                  <li>• What would I tell a friend who had this thought?</li>
                  <li>• What's the most likely outcome?</li>
                  <li>• What can I learn from this situation?</li>
                </ul>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Reframed thought</label>
                <Textarea
                  placeholder="Write a more balanced perspective..."
                  rows={3}
                  className="resize-none"
                  value={quickReframe.reframed}
                  onChange={(e) => setQuickReframe(prev => ({ ...prev, reframed: e.target.value }))}
                />
              </div>

              <Button 
                className="w-full" 
                onClick={handleSaveQuickReframe}
                disabled={saving || !quickReframe.negative || !quickReframe.reframed}
              >
                {saving ? 'Saving...' : 'Save Reframe'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Saved Records */}
        {savedRecords.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display text-xl font-semibold mb-4">Saved Records</h2>
            <div className="space-y-3">
              {savedRecords.map((r) => (
                <Card key={r.id} className="mined-card group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm line-clamp-2 mb-1">{r.situation}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.distortions && r.distortions.length > 0 
                            ? `${r.distortions.length} distortions identified` 
                            : 'Quick reframe'
                          }
                          {' • '}
                          {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={() => handleDeleteRecord(r.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </Layout>
  );
}