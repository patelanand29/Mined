import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, Play, Lock, Unlock, Calendar, MessageSquare, Mic, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import Layout from '@/components/layout/Layout';

interface TimeCapsule {
  id: string;
  type: 'text' | 'voice' | 'video';
  content: string;
  createdAt: string;
  unlockDate: string;
  isUnlocked: boolean;
  mood?: string;
}

export default function TimeCapsule() {
  const [capsules, setCapsules] = useState<TimeCapsule[]>([
    {
      id: '1',
      type: 'text',
      content: 'Hey future me! I hope you\'re doing amazing. Remember how stressed you were about exams? I bet you crushed them! Stay strong and keep believing in yourself.',
      createdAt: '2025-12-15',
      unlockDate: '2026-06-15',
      isUnlocked: false,
    },
    {
      id: '2',
      type: 'text',
      content: 'Today was a really good day. I finally opened up to my friends about what I\'ve been going through, and they were so supportive. Remember this feeling when things get tough.',
      createdAt: '2025-11-20',
      unlockDate: '2025-12-20',
      isUnlocked: true,
      mood: '😊'
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCapsule, setNewCapsule] = useState({ content: '', unlockDate: '', type: 'text' });

  const handleCreateCapsule = () => {
    if (!newCapsule.content || !newCapsule.unlockDate) return;

    const capsule: TimeCapsule = {
      id: Date.now().toString(),
      type: newCapsule.type as 'text' | 'voice' | 'video',
      content: newCapsule.content,
      createdAt: new Date().toISOString().split('T')[0],
      unlockDate: newCapsule.unlockDate,
      isUnlocked: false,
    };

    setCapsules(prev => [capsule, ...prev]);
    setNewCapsule({ content: '', unlockDate: '', type: 'text' });
    setDialogOpen(false);
  };

  const unlockedCapsules = capsules.filter(c => c.isUnlocked);
  const lockedCapsules = capsules.filter(c => !c.isUnlocked);

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 mb-4">
            <Clock className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Time Capsule
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Record messages to your future self. Capture your thoughts, hopes, and reflections to unlock on special dates.
          </p>
        </div>

        {/* Create New Capsule */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Card className="mined-card mb-8 cursor-pointer hover:shadow-lg transition-all border-dashed border-2">
              <CardContent className="p-6 flex items-center justify-center gap-3 text-muted-foreground">
                <Plus className="w-5 h-5" />
                <span className="font-medium">Create a New Time Capsule</span>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">Create Time Capsule</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Type Selection */}
              <Tabs value={newCapsule.type} onValueChange={(v) => setNewCapsule(prev => ({ ...prev, type: v }))}>
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="text" className="gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="voice" className="gap-2">
                    <Mic className="w-4 h-4" />
                    Voice
                  </TabsTrigger>
                  <TabsTrigger value="video" className="gap-2">
                    <Video className="w-4 h-4" />
                    Video
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {newCapsule.type === 'text' && (
                <Textarea
                  placeholder="Write a message to your future self..."
                  value={newCapsule.content}
                  onChange={(e) => setNewCapsule(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  className="resize-none"
                />
              )}

              {newCapsule.type === 'voice' && (
                <div className="p-8 border-2 border-dashed rounded-lg text-center">
                  <Mic className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <Button variant="outline">Start Recording</Button>
                  <p className="text-xs text-muted-foreground mt-2">Max 5 minutes</p>
                </div>
              )}

              {newCapsule.type === 'video' && (
                <div className="p-8 border-2 border-dashed rounded-lg text-center">
                  <Video className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <Button variant="outline">Record Video</Button>
                  <p className="text-xs text-muted-foreground mt-2">Max 2 minutes</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Unlock Date
                </label>
                <Input
                  type="date"
                  value={newCapsule.unlockDate}
                  onChange={(e) => setNewCapsule(prev => ({ ...prev, unlockDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-muted-foreground">
                  This capsule will be locked until this date
                </p>
              </div>

              <Button 
                onClick={handleCreateCapsule} 
                className="w-full"
                disabled={!newCapsule.content || !newCapsule.unlockDate}
              >
                Seal Time Capsule
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Locked Capsules */}
        {lockedCapsules.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-muted-foreground" />
              Locked Capsules
            </h2>
            <div className="grid gap-4">
              {lockedCapsules.map((capsule, i) => (
                <motion.div
                  key={capsule.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="mined-card bg-muted/30">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Time Capsule</p>
                            <p className="text-sm text-muted-foreground">
                              Created {capsule.createdAt}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-primary">Unlocks</p>
                          <p className="text-sm text-muted-foreground">{capsule.unlockDate}</p>
                        </div>
                      </div>
                      <div className="mt-4 p-4 rounded-lg bg-background/50 text-center">
                        <p className="text-muted-foreground italic">
                          🔒 This message is sealed until {capsule.unlockDate}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Unlocked Capsules */}
        {unlockedCapsules.length > 0 && (
          <div>
            <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
              <Unlock className="w-5 h-5 text-green-600" />
              Unlocked Capsules
            </h2>
            <div className="grid gap-4">
              {unlockedCapsules.map((capsule, i) => (
                <motion.div
                  key={capsule.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="mined-card border-l-4 border-l-green-500">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            {capsule.mood || '✨'}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Past You Says...</p>
                            <p className="text-sm text-muted-foreground">
                              Written on {capsule.createdAt}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {capsule.content}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {capsules.length === 0 && (
          <Card className="mined-card">
            <CardContent className="py-12 text-center">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-display text-lg font-semibold mb-2">No Time Capsules Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by creating a message to your future self
              </p>
              <Button onClick={() => setDialogOpen(true)}>Create Your First Capsule</Button>
            </CardContent>
          </Card>
        )}

        {/* Info Section */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10">
          <h3 className="font-display text-lg font-semibold mb-3">About Time Capsules</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Messages are securely stored and linked to your mood calendar</li>
            <li>• Unlock dates can't be changed once sealed</li>
            <li>• During low-mood days, we may suggest revisiting uplifting past messages</li>
            <li>• Your capsules are completely private</li>
          </ul>
        </div>
      </motion.div>
    </Layout>
  );
}
