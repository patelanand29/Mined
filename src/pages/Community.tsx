import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Heart, MessageCircle, Flag, TrendingUp, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Post {
  id: string;
  user_id: string;
  content: string;
  is_anonymous: boolean;
  tags: string[] | null;
  support_count: number;
  relate_count: number;
  helpful_count: number;
  created_at: string;
  author_name?: string;
  user_reaction?: string;
  comments: Comment[];
}

interface Comment {
  id: string;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  author_name?: string;
}

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [newPost, setNewPost] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [filterTag, setFilterTag] = useState('all');
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commentAnonymous, setCommentAnonymous] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [user]);

  const fetchPosts = async () => {
    try {
      // Use secure RPC function that masks user_id for anonymous posts
      const { data: postsData, error } = await supabase
        .rpc('get_community_posts_secure');

      if (error) throw error;

      // Fetch comments and reactions for each post
      const postsWithDetails = await Promise.all(
        (postsData || []).map(async (post) => {
          // Use secure RPC function that masks user_id for anonymous comments
          const { data: comments } = await supabase
            .rpc('get_comments_secure', { p_post_id: post.id });

          // Fetch user reaction if logged in
          let userReaction;
          if (user) {
            const { data: reaction } = await supabase
              .from('post_reactions')
              .select('reaction_type')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .maybeSingle();
            userReaction = reaction?.reaction_type;
          }

          // Get author name if not anonymous (user_id will be null for anonymous posts)
          let authorName = 'Anonymous';
          if (!post.is_anonymous && post.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', post.user_id)
              .maybeSingle();
            authorName = profile?.full_name || 'User';
          }

          return {
            ...post,
            author_name: authorName,
            user_reaction: userReaction,
            comments: (comments || []).map((c: any) => ({
              ...c,
              author_name: c.is_anonymous ? 'Anonymous' : 'User'
            }))
          };
        })
      );

      setPosts(postsWithDetails);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() || !user) {
      if (!user) toast.error('Please sign in to post');
      return;
    }

    try {
      const { error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          content: newPost,
          is_anonymous: isAnonymous,
          tags: []
        });

      if (error) throw error;

      toast.success('Post shared with the community!');
      setNewPost('');
      setIsAnonymous(false);
      setDialogOpen(false);
      fetchPosts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create post');
    }
  };

  const handleReaction = async (postId: string, reaction: 'support' | 'relate' | 'helpful') => {
    if (!user) {
      toast.error('Please sign in to react');
      return;
    }

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.user_reaction === reaction) {
        // Remove reaction
        await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        // Update count
        await supabase
          .from('community_posts')
          .update({ [`${reaction}_count`]: Math.max(0, post[`${reaction}_count`] - 1) })
          .eq('id', postId);
      } else {
        // Remove old reaction if exists
        if (post.user_reaction) {
          await supabase
            .from('post_reactions')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id);

          await supabase
            .from('community_posts')
            .update({ [`${post.user_reaction}_count`]: Math.max(0, post[`${post.user_reaction}_count` as keyof Post] as number - 1) })
            .eq('id', postId);
        }

        // Add new reaction
        await supabase
          .from('post_reactions')
          .upsert({
            post_id: postId,
            user_id: user.id,
            reaction_type: reaction
          });

        await supabase
          .from('community_posts')
          .update({ [`${reaction}_count`]: post[`${reaction}_count`] + 1 })
          .eq('id', postId);
      }

      fetchPosts();
    } catch (error) {
      console.error('Error reacting:', error);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!newComment.trim() || !user) {
      if (!user) toast.error('Please sign in to comment');
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment,
          is_anonymous: commentAnonymous
        });

      if (error) throw error;

      toast.success('Comment added!');
      setNewComment('');
      setCommentAnonymous(false);
      fetchPosts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add comment');
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim() || !selectedPostId || !user) {
      toast.error('Please provide a reason for the report');
      return;
    }

    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          post_id: selectedPostId,
          reason: reportReason
        });

      if (error) throw error;

      toast.success('Report submitted. Thank you for helping keep our community safe.');
      setReportReason('');
      setSelectedPostId(null);
      setReportDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit report');
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const allTags = [...new Set(posts.flatMap(p => p.tags || []))];

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
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : posts.length === 0 ? (
          <Card className="mined-card">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts
              .filter(post => filterTag === 'all' || (post.tags && post.tags.includes(filterTag)))
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
                          <AvatarFallback className={post.is_anonymous ? 'bg-muted' : 'bg-primary text-primary-foreground'}>
                            {post.is_anonymous ? '?' : post.author_name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{post.author_name}</p>
                          <p className="text-xs text-muted-foreground">{formatTime(post.created_at)}</p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground"
                        onClick={() => {
                          setSelectedPostId(post.id);
                          setReportDialogOpen(true);
                        }}
                      >
                        <Flag className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-foreground leading-relaxed mb-4">{post.content}</p>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
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
                        className={`gap-1.5 ${post.user_reaction === 'support' ? 'text-rose-500' : ''}`}
                        onClick={() => handleReaction(post.id, 'support')}
                      >
                        <Heart className={`w-4 h-4 ${post.user_reaction === 'support' ? 'fill-current' : ''}`} />
                        <span>{post.support_count}</span>
                        <span className="text-xs text-muted-foreground">Support</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-1.5 ${post.user_reaction === 'relate' ? 'text-blue-500' : ''}`}
                        onClick={() => handleReaction(post.id, 'relate')}
                      >
                        🤝
                        <span>{post.relate_count}</span>
                        <span className="text-xs text-muted-foreground">Relate</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-1.5 ${post.user_reaction === 'helpful' ? 'text-amber-500' : ''}`}
                        onClick={() => handleReaction(post.id, 'helpful')}
                      >
                        💡
                        <span>{post.helpful_count}</span>
                        <span className="text-xs text-muted-foreground">Helpful</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-1.5 ml-auto"
                        onClick={() => setExpandedComments(expandedComments === post.id ? null : post.id)}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments.length}</span>
                      </Button>
                    </div>

                    {/* Comments Section */}
                    {expandedComments === post.id && (
                      <div className="mt-4 pt-4 border-t border-border">
                        {post.comments.map(comment => (
                          <div key={comment.id} className="mb-3 p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{comment.author_name}</span>
                              <span className="text-xs text-muted-foreground">{formatTime(comment.created_at)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{comment.content}</p>
                          </div>
                        ))}

                        {/* Add Comment */}
                        <div className="flex gap-2 mt-3">
                          <Input
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="flex-1"
                          />
                          <Button size="sm" onClick={() => handleAddComment(post.id)}>
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Switch 
                            checked={commentAnonymous} 
                            onCheckedChange={setCommentAnonymous}
                            id="comment-anon"
                          />
                          <label htmlFor="comment-anon" className="text-xs text-muted-foreground">
                            Comment anonymously
                          </label>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Report Dialog */}
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                placeholder="Please describe why you're reporting this post..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setReportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleReport} disabled={!reportReason.trim()}>
                  Submit Report
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
