import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Send, Sparkles, RefreshCw, Save, Flame, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIResponse {
  reflection: string;
  reframe: string;
  suggestion: string;
}

interface SavedSession {
  id: string;
  input_text: string;
  reflection: string | null;
  reframe: string | null;
  suggestion: string | null;
  generated_image_url: string | null;
  created_at: string;
}

export default function EmotionAlchemist() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);

  useEffect(() => {
    if (user) {
      fetchSavedSessions();
    }
  }, [user]);

  const fetchSavedSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('emotion_alchemist_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSavedSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const processEmotion = async () => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    setResponse(null);
    setGeneratedImage(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-emotion', {
        body: { text: input, type: 'emotion-alchemist' }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setResponse({
        reflection: data.reflection || '',
        reframe: data.reframe || '',
        suggestion: data.suggestion || ''
      });
    } catch (error: any) {
      console.error('Error processing emotion:', error);
      toast.error(error.message || 'Failed to process emotion');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateImage = async () => {
    if (!input.trim()) return;

    setIsGeneratingImage(true);

    try {
      // Use Pollinations API for image generation
      const prompt = encodeURIComponent(`Abstract art representing the emotion: ${input}. Peaceful, therapeutic, calming colors, watercolor style.`);
      const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=512&height=512&nologo=true`;
      
      setGeneratedImage(imageUrl);
      toast.success('Image generated!');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const saveSession = async () => {
    if (!response || !input || !user) {
      if (!user) toast.error('Please sign in to save');
      if (!response) toast.error('Please transform your emotions first');
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('emotion_alchemist_sessions')
        .insert({
          user_id: user.id,
          input_text: input,
          reflection: response.reflection,
          reframe: response.reframe,
          suggestion: response.suggestion,
          generated_image_url: generatedImage
        });

      if (error) throw error;

      toast.success('Session saved! 💜');
      fetchSavedSessions();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save session');
    } finally {
      setIsSaving(false);
    }
  };

  const burnSession = () => {
    setInput('');
    setResponse(null);
    setGeneratedImage(null);
    toast.success('Session released 🔥 Let it go...');
  };

  const resetSession = () => {
    setInput('');
    setResponse(null);
    setGeneratedImage(null);
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
                    <Button 
                      variant="outline" 
                      onClick={saveSession} 
                      className="gap-2"
                      disabled={isSaving}
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="outline" onClick={burnSession} className="gap-2 text-orange-500 hover:text-orange-600">
                      <Flame className="w-4 h-4" />
                      Burn
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

            {/* Image Generation */}
            <Card className="mined-card">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">🎨</span>
                    Emotion Art
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={generateImage}
                    disabled={isGeneratingImage}
                    className="gap-2"
                  >
                    <Image className="w-4 h-4" />
                    {isGeneratingImage ? 'Generating...' : 'Generate Art'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {generatedImage ? (
                  <motion.img
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={generatedImage}
                    alt="Generated emotion art"
                    className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                  />
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Click "Generate Art" to create an abstract visualization of your emotions
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Saved Sessions */}
        {savedSessions.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-xl font-semibold mb-4">Saved Sessions</h2>
            <div className="space-y-3">
              {savedSessions.map((session) => (
                <Card key={session.id} className="mined-card">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      "{session.input_text}"
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.created_at).toLocaleDateString()}
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
            <li>• Use "Burn" to symbolically release difficult emotions</li>
          </ul>
        </div>
      </motion.div>
    </Layout>
  );
}