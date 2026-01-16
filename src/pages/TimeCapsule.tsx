import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Play, Pause, Lock, Unlock, Calendar, MessageSquare, Mic, Video, Trash2, Square, RefreshCw, Heart, Bell, BellOff, Image, Smile, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import Layout from '@/components/layout/Layout';
import MotivationalCapsulePrompt from '@/components/MotivationalCapsulePrompt';
import { useAuth } from '@/hooks/useAuth';
import { useMediaRecorder, formatTime } from '@/hooks/useMediaRecorder';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns';

interface TimeCapsuleData {
  id: string;
  title: string;
  capsule_type: 'text' | 'voice' | 'video';
  content: string | null;
  media_url: string | null;
  created_at: string;
  unlock_date: string;
  is_unlocked: boolean;
  is_motivational: boolean;
}

export default function TimeCapsule() {
  const { user } = useAuth();
  const { settings, saveSettings, permissionStatus, requestPermission } = useNotifications();
  
  const [capsules, setCapsules] = useState<TimeCapsuleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCapsule, setNewCapsule] = useState({ content: '', unlockDate: '', type: 'text', title: '' });
  const [playingMedia, setPlayingMedia] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showSmilePopup, setShowSmilePopup] = useState(false);

  // Media recorders
  const audioRecorder = useMediaRecorder({ type: 'audio', maxDurationSeconds: 300 });
  const videoRecorder = useMediaRecorder({ type: 'video', maxDurationSeconds: 120 });

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Connect video preview to stream when recording
  useEffect(() => {
    if (videoRecorder.isRecording && videoRecorder.stream && videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = videoRecorder.stream;
      videoPreviewRef.current.play().catch(console.error);
    }
  }, [videoRecorder.isRecording, videoRecorder.stream]);

  // Fetch capsules from database
  useEffect(() => {
    if (user) {
      fetchCapsules();
    }
  }, [user]);

  // Auto-unlock capsules that have passed their unlock date
  useEffect(() => {
    const checkUnlocks = async () => {
      const now = new Date().toISOString();
      const capsulesToUnlock = capsules.filter(c => !c.is_unlocked && !c.is_motivational && isPast(parseISO(c.unlock_date)));
      
      for (const capsule of capsulesToUnlock) {
        await supabase
          .from('time_capsules')
          .update({ is_unlocked: true })
          .eq('id', capsule.id);
      }
      
      if (capsulesToUnlock.length > 0) {
        fetchCapsules();
        toast.success(`${capsulesToUnlock.length} time capsule(s) unlocked!`);
      }
    };
    
    checkUnlocks();
  }, [capsules]);

  const fetchCapsules = async () => {
    try {
      const { data, error } = await supabase
        .from('time_capsules')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCapsules((data as TimeCapsuleData[]) || []);
    } catch (error) {
      console.error('Error fetching capsules:', error);
      toast.error('Failed to load time capsules');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo must be less than 5MB');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const uploadPhoto = async (userId: string, capsuleId: string): Promise<string | null> => {
    if (!photoFile) return null;

    try {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${userId}/${capsuleId}-photo.${fileExt}`;

      const { error } = await supabase.storage
        .from('capsule-media')
        .upload(fileName, photoFile, {
          contentType: photoFile.type,
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('capsule-media')
        .getPublicUrl(fileName);

      return urlData?.publicUrl || null;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  const handleCreateCapsule = async () => {
    if (!user) {
      toast.error('Please sign in to create a time capsule');
      return;
    }

    const type = newCapsule.type as 'text' | 'voice' | 'video';
    
    // Validate based on type
    if (type === 'text' && !newCapsule.content.trim() && !photoFile) {
      toast.error('Please write a message or add a photo');
      return;
    }
    if (type === 'voice' && !audioRecorder.mediaBlob) {
      toast.error('Please record a voice message');
      return;
    }
    if (type === 'video' && !videoRecorder.mediaBlob) {
      toast.error('Please record a video message');
      return;
    }
    if (!newCapsule.unlockDate) {
      toast.error('Please select an unlock date');
      return;
    }

    setSaving(true);

    try {
      // Generate a temporary ID for the capsule
      const tempId = crypto.randomUUID();

      // Upload media if needed
      let mediaUrl: string | null = null;
      if (type === 'voice' && audioRecorder.mediaBlob) {
        mediaUrl = await audioRecorder.uploadMedia(user.id, tempId);
      } else if (type === 'video' && videoRecorder.mediaBlob) {
        mediaUrl = await videoRecorder.uploadMedia(user.id, tempId);
      } else if (type === 'text' && photoFile) {
        mediaUrl = await uploadPhoto(user.id, tempId);
      }

      // Create the capsule
      const { error } = await supabase
        .from('time_capsules')
        .insert({
          id: tempId,
          user_id: user.id,
          title: newCapsule.title || `Time Capsule - ${format(new Date(), 'MMM d, yyyy')}`,
          capsule_type: type,
          content: type === 'text' ? newCapsule.content : null,
          media_url: mediaUrl,
          unlock_date: new Date(newCapsule.unlockDate).toISOString(),
          is_unlocked: false,
          is_motivational: false,
        });

      if (error) throw error;

      toast.success('Time capsule sealed! 🔒');
      setNewCapsule({ content: '', unlockDate: '', type: 'text', title: '' });
      audioRecorder.resetRecording();
      videoRecorder.resetRecording();
      removePhoto();
      setDialogOpen(false);
      fetchCapsules();
    } catch (error) {
      console.error('Error creating capsule:', error);
      toast.error('Failed to create time capsule');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCapsule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('time_capsules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCapsules(prev => prev.filter(c => c.id !== id));
      toast.success('Capsule deleted');
    } catch (error) {
      console.error('Error deleting capsule:', error);
      toast.error('Failed to delete capsule');
    }
  };

  const unlockedCapsules = capsules.filter(c => c.is_unlocked);
  const lockedCapsules = capsules.filter(c => !c.is_unlocked);
  const motivationalUnlocked = unlockedCapsules.find(c => c.is_motivational);

  const getTimeUntilUnlock = (unlockDate: string) => {
    const unlock = parseISO(unlockDate);
    if (isPast(unlock)) return 'Ready to unlock!';
    return `Unlocks ${formatDistanceToNow(unlock, { addSuffix: true })}`;
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* SMILE Popup */}
        <AnimatePresence>
          {showSmilePopup && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
              onClick={() => setShowSmilePopup(false)}
            >
              <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                exit={{ y: 50 }}
                className="bg-background p-8 rounded-3xl shadow-2xl text-center max-w-sm mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-8xl mb-4"
                >
                  😊
                </motion.div>
                <h2 className="font-display text-3xl font-bold text-foreground mb-2">SMILE!</h2>
                <p className="text-muted-foreground mb-4">
                  You're doing great! Take a moment to smile and appreciate yourself.
                </p>
                <Button onClick={() => setShowSmilePopup(false)} className="w-full">
                  Thanks! 💖
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 mb-2">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Time Capsule
            </h1>
            <p className="text-muted-foreground mt-1">
              Record messages to your future self
            </p>
          </div>
          
          <div className="flex gap-2">
            {/* Smile Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSmilePopup(true)}
              className="gap-2"
            >
              <Smile className="w-4 h-4" />
              SMILE!
            </Button>
            
            {/* Notification toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (permissionStatus !== 'granted') {
                  requestPermission();
                } else {
                  saveSettings({ capsule_unlock_notify: !settings.capsule_unlock_notify });
                }
              }}
              className="gap-2"
            >
              {settings.capsule_unlock_notify && permissionStatus === 'granted' ? (
                <>
                  <Bell className="w-4 h-4" />
                  Notifications On
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4" />
                  Enable Notifications
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Motivational Capsule Prompt */}
        <div className="mb-6">
          <MotivationalCapsulePrompt onComplete={fetchCapsules} />
        </div>

        {/* Motivational Capsule Banner (if unlocked) */}
        {motivationalUnlocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6"
          >
            <Card className="border-2 border-primary bg-primary/10">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary mb-2">
                      💝 A Message From Your Past Self
                    </h3>
                    <p className="text-foreground whitespace-pre-wrap">
                      {motivationalUnlocked.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-3">
                      Written on {format(parseISO(motivationalUnlocked.created_at), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

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
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">Create Time Capsule</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Title (optional)</label>
                <Input
                  placeholder="Give your capsule a name..."
                  value={newCapsule.title}
                  onChange={(e) => setNewCapsule(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

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

              {/* Text Content */}
              {newCapsule.type === 'text' && (
                <div className="space-y-4">
                  <Textarea
                    placeholder="Write a message to your future self..."
                    value={newCapsule.content}
                    onChange={(e) => setNewCapsule(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                    className="resize-none"
                  />
                  
                  {/* Photo Upload */}
                  <div className="space-y-2">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    
                    {photoPreview ? (
                      <div className="relative">
                        <img 
                          src={photoPreview} 
                          alt="Preview" 
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={removePhoto}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => photoInputRef.current?.click()}
                      >
                        <Image className="w-4 h-4" />
                        Add a Photo
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Voice Recording */}
              {newCapsule.type === 'voice' && (
                <div className="p-6 border-2 border-dashed rounded-lg text-center space-y-4">
                  {audioRecorder.mediaUrl ? (
                    <>
                      <audio src={audioRecorder.mediaUrl} controls className="w-full" />
                      <Button variant="outline" onClick={audioRecorder.resetRecording}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Record Again
                      </Button>
                    </>
                  ) : (
                    <>
                      <Mic className={`w-12 h-12 mx-auto ${audioRecorder.isRecording ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`} />
                      
                      {audioRecorder.isRecording && (
                        <p className="text-lg font-mono text-destructive">
                          {formatTime(audioRecorder.recordingTime)}
                        </p>
                      )}
                      
                      <div className="flex justify-center gap-2">
                        {!audioRecorder.isRecording ? (
                          <Button onClick={audioRecorder.startRecording}>
                            <Mic className="w-4 h-4 mr-2" />
                            Start Recording
                          </Button>
                        ) : (
                          <>
                            {audioRecorder.isPaused ? (
                              <Button variant="outline" onClick={audioRecorder.resumeRecording}>
                                <Play className="w-4 h-4 mr-2" />
                                Resume
                              </Button>
                            ) : (
                              <Button variant="outline" onClick={audioRecorder.pauseRecording}>
                                <Pause className="w-4 h-4 mr-2" />
                                Pause
                              </Button>
                            )}
                            <Button variant="destructive" onClick={audioRecorder.stopRecording}>
                              <Square className="w-4 h-4 mr-2" />
                              Stop
                            </Button>
                          </>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground">Max 5 minutes</p>
                    </>
                  )}
                </div>
              )}

              {/* Video Recording */}
              {newCapsule.type === 'video' && (
                <div className="p-6 border-2 border-dashed rounded-lg text-center space-y-4">
                  {videoRecorder.mediaUrl ? (
                    <>
                      <video 
                        src={videoRecorder.mediaUrl} 
                        controls 
                        className="w-full rounded-lg"
                        playsInline
                      />
                      <Button variant="outline" onClick={videoRecorder.resetRecording}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Record Again
                      </Button>
                    </>
                  ) : videoRecorder.isRecording ? (
                    <>
                      {/* Live video preview */}
                      <video
                        ref={videoPreviewRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full rounded-lg bg-black"
                      />
                      
                      <p className="text-lg font-mono text-destructive">
                        {formatTime(videoRecorder.recordingTime)}
                      </p>
                      
                      <Button variant="destructive" onClick={videoRecorder.stopRecording}>
                        <Square className="w-4 h-4 mr-2" />
                        Stop Recording
                      </Button>
                      
                      <p className="text-xs text-muted-foreground">Max 2 minutes</p>
                    </>
                  ) : (
                    <>
                      <Video className="w-12 h-12 mx-auto text-muted-foreground" />
                      
                      <Button onClick={videoRecorder.startRecording}>
                        <Video className="w-4 h-4 mr-2" />
                        Start Recording
                      </Button>
                      
                      <p className="text-xs text-muted-foreground">Max 2 minutes</p>
                    </>
                  )}
                </div>
              )}

              {/* Unlock Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Unlock Date & Time
                </label>
                <Input
                  type="datetime-local"
                  value={newCapsule.unlockDate}
                  onChange={(e) => setNewCapsule(prev => ({ ...prev, unlockDate: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-muted-foreground">
                  This capsule will be locked until this date and time
                </p>
              </div>

              <Button 
                onClick={handleCreateCapsule} 
                className="w-full"
                disabled={saving}
              >
                {saving ? 'Sealing...' : 'Seal Time Capsule'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        )}

        {/* Locked Capsules */}
        {!loading && lockedCapsules.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-muted-foreground" />
              Locked Capsules ({lockedCapsules.length})
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
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            capsule.is_motivational 
                              ? 'bg-primary/20' 
                              : 'bg-primary/20'
                          }`}>
                            {capsule.is_motivational ? (
                              <Heart className="w-5 h-5 text-primary" />
                            ) : capsule.capsule_type === 'voice' ? (
                              <Mic className="w-5 h-5 text-primary" />
                            ) : capsule.capsule_type === 'video' ? (
                              <Video className="w-5 h-5 text-primary" />
                            ) : (
                              <Lock className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {capsule.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Created {format(parseISO(capsule.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-primary">
                            {capsule.is_motivational ? 'Emergency Capsule' : getTimeUntilUnlock(capsule.unlock_date)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {capsule.is_motivational 
                              ? 'Unlocks when you need it'
                              : format(parseISO(capsule.unlock_date), 'MMM d, yyyy h:mm a')
                            }
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 p-4 rounded-lg bg-background/50 text-center">
                        <p className="text-muted-foreground italic">
                          🔒 This message is sealed
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
        {!loading && unlockedCapsules.filter(c => !c.is_motivational).length > 0 && (
          <div>
            <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
              <Unlock className="w-5 h-5 text-green-600" />
              Unlocked Capsules ({unlockedCapsules.filter(c => !c.is_motivational).length})
            </h2>
            <div className="grid gap-4">
              {unlockedCapsules.filter(c => !c.is_motivational).map((capsule, i) => (
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
                            {capsule.capsule_type === 'voice' ? (
                              <Mic className="w-5 h-5 text-green-600" />
                            ) : capsule.capsule_type === 'video' ? (
                              <Video className="w-5 h-5 text-green-600" />
                            ) : (
                              <MessageSquare className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{capsule.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Written {format(parseISO(capsule.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteCapsule(capsule.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Content based on type */}
                      {capsule.capsule_type === 'text' && (
                        <div className="space-y-3">
                          {capsule.content && (
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {capsule.content}
                            </p>
                          )}
                          {capsule.media_url && (
                            <img 
                              src={capsule.media_url} 
                              alt="Capsule photo" 
                              className="w-full rounded-lg"
                            />
                          )}
                        </div>
                      )}
                      
                      {capsule.capsule_type === 'voice' && capsule.media_url && (
                        <audio 
                          src={capsule.media_url} 
                          controls 
                          className="w-full"
                          preload="metadata"
                        />
                      )}
                      
                      {capsule.capsule_type === 'video' && capsule.media_url && (
                        <video 
                          src={capsule.media_url} 
                          controls 
                          className="w-full rounded-lg"
                          preload="metadata"
                          playsInline
                        />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && capsules.length === 0 && (
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
            <li>• Voice messages up to 5 minutes, video up to 2 minutes</li>
            <li>• You can add photos to text capsules for memories</li>
            <li>• During difficult times, your self-care capsule may automatically unlock</li>
            <li>• Your capsules are completely private</li>
          </ul>
        </div>
      </motion.div>
    </Layout>
  );
}