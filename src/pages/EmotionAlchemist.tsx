import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Send, Sparkles, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import Layout from '@/components/layout/Layout';

interface AIResponse {
  reflection: string;
  reframe: string;
  suggestion: string;
}

export default function EmotionAlchemist() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [savedSessions, setSavedSessions] = useState<{ input: string; response: AIResponse }[]>([]);

  const processEmotion = async () => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    
    // Simulated AI response - in production, this would call your AI backend
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const aiResponse: AIResponse = {
      reflection: `I hear that you're experiencing ${input.toLowerCase().includes('stress') ? 'stress' : input.toLowerCase().includes('sad') ? 'sadness' : input.toLowerCase().includes('angry') ? 'anger' : 'complex emotions'}. These feelings are valid and it's brave of you to acknowledge them. Your awareness of these emotions is the first step toward understanding and managing them.`,
      reframe: `Instead of seeing this as overwhelming, consider this perspective: Every challenging emotion is an opportunity for growth. What you're feeling right now is temporary, and you have the strength to navigate through it. Many people have felt exactly as you do and have found their way to calmer waters.`,
      suggestion: `Try this: Take 5 deep breaths, focusing on the exhale. Then, write down three small things you're grateful for today. This simple practice can help shift your emotional state and create space for positive thoughts.`
    };
    
    setResponse(aiResponse);
    setIsProcessing(false);
  };

  const saveSession = () => {
    if (response && input) {
      setSavedSessions(prev => [...prev, { input, response }]);
    }
  };

  const resetSession = () => {
    setInput('');
    setResponse(null);
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 mb-4">
            <Brain className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Emotion Alchemist
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Transform your feelings with AI-powered therapeutic guidance. Share what's on your mind and receive thoughtful reflections.
          </p>
        </div>

        {/* Main Input Card */}
        <Card className="mined-card mb-8">
          <CardContent className="p-6">
            <Textarea
              placeholder="Share what you're feeling or experiencing right now... I'm here to listen and help you find clarity."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={5}
              className="resize-none text-base mb-4"
            />
            
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Your thoughts are private and secure
              </p>
              <div className="flex gap-2">
                {response && (
                  <>
                    <Button variant="outline" onClick={saveSession} className="gap-2">
                      <Save className="w-4 h-4" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={resetSession} className="gap-2">
                      <RefreshCw className="w-4 h-4" />
                      New
                    </Button>
                  </>
                )}
                <Button 
                  onClick={processEmotion} 
                  disabled={isProcessing || !input.trim()}
                  className="gap-2"
                >
                  {isProcessing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-4 h-4" />
                      </motion.div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Transform
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Response */}
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card className="mined-card border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <span className="text-2xl">💭</span>
                  Reflection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{response.reflection}</p>
              </CardContent>
            </Card>

            <Card className="mined-card border-l-4 border-l-teal-500">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <span className="text-2xl">🔄</span>
                  Reframe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{response.reframe}</p>
              </CardContent>
            </Card>

            <Card className="mined-card border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <span className="text-2xl">💡</span>
                  Suggestion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{response.suggestion}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Saved Sessions */}
        {savedSessions.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-xl font-semibold mb-4">Saved Sessions</h2>
            <div className="space-y-3">
              {savedSessions.map((session, i) => (
                <Card key={i} className="mined-card">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      "{session.input}"
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-violet-500/10">
          <h3 className="font-display text-lg font-semibold mb-3">Tips for Better Results</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Be honest about what you're feeling - there's no judgment here</li>
            <li>• Include specific situations or triggers if comfortable</li>
            <li>• You can share as little or as much as you'd like</li>
            <li>• Save meaningful sessions to revisit during challenging times</li>
          </ul>
        </div>
      </motion.div>
    </Layout>
  );
}
