import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useMentalHealthMonitor } from '@/hooks/useMentalHealthMonitor';

interface MotivationalCapsulePromptProps {
  onComplete?: () => void;
}

export default function MotivationalCapsulePrompt({ onComplete }: MotivationalCapsulePromptProps) {
  const { hasMotivationalCapsule, createMotivationalCapsule } = useMentalHealthMonitor();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  if (hasMotivationalCapsule) return null;

  const handleSave = async () => {
    if (!content.trim()) return;
    
    setSaving(true);
    await createMotivationalCapsule(content);
    setSaving(false);
    setOpen(false);
    setContent('');
    onComplete?.();
  };

  const prompts = [
    "What would you tell yourself on a really hard day?",
    "What are 3 things you love about yourself?",
    "What gives you hope when things get tough?",
    "What's a memory that always makes you smile?",
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="mined-card cursor-pointer hover:shadow-lg transition-all border-dashed border-2 border-pink-300 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-pink-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Create Your Self-Care Capsule</h3>
                <p className="text-sm text-muted-foreground">
                  Write a message for yourself that will be there when you need it most
                </p>
              </div>
              <Sparkles className="w-5 h-5 text-pink-500" />
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Your Self-Care Capsule
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            This message will be unlocked automatically if we notice you might be going through a tough time. 
            Write something that will bring you comfort, hope, or a smile.
          </p>

          <div className="flex flex-wrap gap-2">
            {prompts.map((prompt, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setContent(prev => prev ? prev + '\n\n' + prompt : prompt)}
              >
                {prompt}
              </Button>
            ))}
          </div>

          <Textarea
            placeholder="Dear future me..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="resize-none"
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Later
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!content.trim() || saving}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              {saving ? 'Saving...' : 'Seal Capsule'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
