import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Edit2, Save, TrendingUp, Calendar, BookOpen, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Profile {
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

interface MoodStats {
  totalEntries: number;
  thisMonth: number;
  averageMood: string;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({ full_name: '', bio: '', avatar_url: '' });
  const [editedProfile, setEditedProfile] = useState<Profile>({ full_name: '', bio: '', avatar_url: '' });
  const [moodStats, setMoodStats] = useState<MoodStats>({ totalEntries: 0, thisMonth: 0, averageMood: '😊' });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchMoodStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setEditedProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoodStats = async () => {
    try {
      const { data: allMoods } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user?.id);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { data: monthMoods } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', startOfMonth.toISOString());

      setMoodStats({
        totalEntries: allMoods?.length || 0,
        thisMonth: monthMoods?.length || 0,
        averageMood: '😊'
      });
    } catch (error) {
      console.error('Error fetching mood stats:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editedProfile.full_name,
          bio: editedProfile.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      setProfile(editedProfile);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const getInitials = () => {
    if (profile.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
              <User className="w-8 h-8 text-primary" />
              Profile
            </h1>
            <p className="text-muted-foreground mt-1">Manage your account settings</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2 text-destructive">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="mined-card mb-6">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="font-display">Your Information</CardTitle>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            ) : (
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                {isEditing ? (
                  <Input
                    value={editedProfile.full_name || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Your name"
                    className="text-lg font-semibold"
                  />
                ) : (
                  <h2 className="text-xl font-semibold">{profile.full_name || 'No name set'}</h2>
                )}
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Bio</label>
              {isEditing ? (
                <Textarea
                  value={editedProfile.bio || ''}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              ) : (
                <p className="text-muted-foreground">
                  {profile.bio || 'No bio yet. Click edit to add one!'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="mined-card">
            <CardContent className="p-5 text-center">
              <Calendar className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="font-display text-2xl font-bold">{moodStats.totalEntries}</div>
              <div className="text-sm text-muted-foreground">Total Mood Entries</div>
            </CardContent>
          </Card>
          <Card className="mined-card">
            <CardContent className="p-5 text-center">
              <TrendingUp className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <div className="font-display text-2xl font-bold">{moodStats.thisMonth}</div>
              <div className="text-sm text-muted-foreground">This Month</div>
            </CardContent>
          </Card>
          <Card className="mined-card">
            <CardContent className="p-5 text-center">
              <BookOpen className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
              <div className="font-display text-2xl font-bold">{moodStats.averageMood}</div>
              <div className="text-sm text-muted-foreground">Most Common Mood</div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </Layout>
  );
}
