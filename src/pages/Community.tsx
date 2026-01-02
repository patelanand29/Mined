import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Heart, MessageCircle, Share2, Flag, Filter, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Layout from '@/components/layout/Layout';

interface Post {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  isAnonymous: boolean;
  reactions: { support: number; relate: number; helpful: number };
  userReaction?: 'support' | 'relate' | 'helpful';
  comments: number;
  tags: string[];
}

const SAMPLE_POSTS: Post[] = [
  {
    id: '1',
    author: 'Priya S.',
    avatar: 'PS',
    content: 'Just completed my first week of daily meditation! It\'s been challenging to stay consistent with exams coming up, but I\'m already noticing small changes in how I handle stress. Anyone else using the breathing exercises here?',
    timestamp: '2 hours ago',
    isAnonymous: false,
    reactions: { support: 24, relate: 18, helpful: 12 },
    comments: 8,
    tags: ['meditation', 'exams', 'progress']
  },
  {
    id: '2',
    author: 'Anonymous',
    avatar: '?',
    content: 'Feeling overwhelmed with everything lately. College pressure, family expectations, and trying to figure out my future. Some days it feels like too much. Grateful for this space where I can share without judgment.',
    timestamp: '5 hours ago',
    isAnonymous: true,
    reactions: { support: 45, relate: 67, helpful: 8 },
    comments: 15,
    tags: ['overwhelmed', 'college', 'support-needed']
  },
  {
    id: '3',
    author: 'Arjun M.',
    avatar: 'AM',
    content: 'Tip that helped me: When anxiety hits before presentations, I use the 4-7-8 breathing technique. 3 cycles and I feel noticeably calmer. The CBT tools here also helped me identify my negative thought patterns.',
    timestamp: '1 day ago',
    isAnonymous: false,
    reactions: { support: 32, relate: 28, helpful: 56 },
    comments: 12,
    tags: ['anxiety', 'tips', 'cbt']
  },
];

export default function Community() {
  const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [filterTag, setFilterTag] = useState('all');

  const handleCreatePost = () => {
    if (!newPost.trim()) return;

    const post: Post = {
      id: Date.now().toString(),
      author: isAnonymous ? 'Anonymous' : 'You',
      avatar: isAnonymous ? '?' : 'YO',
      content: newPost,
      timestamp: 'Just now',
      isAnonymous,
      reactions: { support: 0, relate: 0, helpful: 0 },
      comments: 0,
      tags: []
    };

    setPosts(prev => [post, ...prev]);
    setNewPost('');
    setIsAnonymous(false);
    setDialogOpen(false);
  };

  const handleReaction = (postId: string, reaction: 'support' | 'relate' | 'helpful') => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const wasSelected = post.userReaction === reaction;
        return {
          ...post,
          userReaction: wasSelected ? undefined : reaction,
          reactions: {
            ...post.reactions,
            [reaction]: wasSelected ? post.reactions[reaction] - 1 : post.reactions[reaction] + 1,
            ...(post.userReaction && post.userReaction !== reaction
              ? { [post.userReaction]: post.reactions[post.userReaction] - 1 }
              : {})
          }
        };
      }
      return post;
    }));
  };

  const allTags = [...new Set(posts.flatMap(p => p.tags))];

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-8 h-8 text-amber-600" />
              Peer Community
            </h1>
            <p className="text-muted-foreground mt-1">Connect with others who understand your journey</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Share Your Story
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">Share with the Community</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <Textarea
                  placeholder="What's on your mind? Share your experiences, ask for support, or offer encouragement to others..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  rows={5}
                  className="resize-none"
                />

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Post Anonymously</p>
                    <p className="text-xs text-muted-foreground">Your name won't be visible</p>
                  </div>
                  <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                </div>

                <Button onClick={handleCreatePost} className="w-full" disabled={!newPost.trim()}>
                  Post
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          <Button
            variant={filterTag === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterTag('all')}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            All Posts
          </Button>
          {allTags.slice(0, 5).map(tag => (
            <Button
              key={tag}
              variant={filterTag === tag ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterTag(tag)}
            >
              #{tag}
            </Button>
          ))}
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts
            .filter(post => filterTag === 'all' || post.tags.includes(filterTag))
            .map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="mined-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className={post.isAnonymous ? 'bg-muted' : 'bg-primary text-primary-foreground'}>
                          {post.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{post.author}</p>
                        <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                      <Flag className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-foreground leading-relaxed mb-4">{post.content}</p>

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {post.tags.map(tag => (
                        <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Reactions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`gap-1.5 ${post.userReaction === 'support' ? 'text-rose-500' : ''}`}
                      onClick={() => handleReaction(post.id, 'support')}
                    >
                      <Heart className={`w-4 h-4 ${post.userReaction === 'support' ? 'fill-current' : ''}`} />
                      <span>{post.reactions.support}</span>
                      <span className="text-xs text-muted-foreground">Support</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`gap-1.5 ${post.userReaction === 'relate' ? 'text-blue-500' : ''}`}
                      onClick={() => handleReaction(post.id, 'relate')}
                    >
                      🤝
                      <span>{post.reactions.relate}</span>
                      <span className="text-xs text-muted-foreground">Relate</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`gap-1.5 ${post.userReaction === 'helpful' ? 'text-amber-500' : ''}`}
                      onClick={() => handleReaction(post.id, 'helpful')}
                    >
                      💡
                      <span>{post.reactions.helpful}</span>
                      <span className="text-xs text-muted-foreground">Helpful</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1.5 ml-auto">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Community Guidelines */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10">
          <h3 className="font-display text-lg font-semibold mb-3">Community Guidelines</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Be kind and supportive - everyone is on their own journey</li>
            <li>• Respect privacy - don't share others' stories without permission</li>
            <li>• Use content warnings for potentially triggering topics</li>
            <li>• Report any harmful content using the flag button</li>
          </ul>
        </div>
      </motion.div>
    </Layout>
  );
}
