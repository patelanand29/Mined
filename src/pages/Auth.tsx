import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import minedLogo from '@/assets/mined-logo.png';
import { useAuth } from '@/hooks/useAuth';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, signIn, signUp, resetPassword, updatePassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  // Check if this is a password reset callback
  useEffect(() => {
    if (searchParams.get('reset') === 'true' && user) {
      setIsPasswordReset(true);
    }
  }, [searchParams, user]);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    const { error } = await signIn(loginForm.email, loginForm.password);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Welcome back to MINED! 🌱');
      navigate('/');
    }
    setIsLoading(false);
  };

  // Validate password strength
  const validatePassword = (password: string): string | null => {
    if (password.length < 12) {
      return 'Password must be at least 12 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must include at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must include at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must include at least one number';
    }
    return null;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.name || !signupForm.email || !signupForm.password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    const passwordError = validatePassword(signupForm.password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }
    
    setIsLoading(true);
    const { error } = await signUp(signupForm.email, signupForm.password, signupForm.name);
    
    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('This email is already registered. Please sign in instead.');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Welcome to MINED! Your journey begins now 🌱');
      navigate('/');
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    const { error } = await resetPassword(resetEmail);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password reset link sent! Check your email.');
      setShowForgotPassword(false);
      setResetEmail('');
    }
    setIsLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error('Please enter a new password');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }
    
    setIsLoading(true);
    const { error } = await updatePassword(newPassword);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated successfully!');
      setIsPasswordReset(false);
      navigate('/');
    }
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen mined-gradient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-foreground"></div>
      </div>
    );
  }

  // Password reset flow
  if (isPasswordReset) {
    return (
      <div className="min-h-screen mined-gradient-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex flex-col items-center mb-8">
            <img src={minedLogo} alt="MINED" className="w-20 h-20 drop-shadow-lg mb-3" />
            <h1 className="font-display text-3xl font-bold text-primary-foreground">MINED</h1>
          </Link>

          <Card className="mined-card">
            <CardHeader className="text-center pb-2">
              <CardTitle className="font-display text-2xl flex items-center justify-center gap-2">
                <KeyRound className="w-5 h-5" />
                Set New Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New password (min 12 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Password must be at least 12 characters with uppercase, lowercase, and numbers
                </p>

                <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Password'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Forgot password flow
  if (showForgotPassword) {
    return (
      <div className="min-h-screen mined-gradient-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex flex-col items-center mb-8">
            <img src={minedLogo} alt="MINED" className="w-20 h-20 drop-shadow-lg mb-3" />
            <h1 className="font-display text-3xl font-bold text-primary-foreground">MINED</h1>
          </Link>

          <Card className="mined-card">
            <CardHeader className="text-center pb-2">
              <CardTitle className="font-display text-2xl">Reset Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Back to Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mined-gradient-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="flex flex-col items-center mb-8">
          <img src={minedLogo} alt="MINED" className="w-20 h-20 drop-shadow-lg mb-3" />
          <h1 className="font-display text-3xl font-bold text-primary-foreground">MINED</h1>
          <p className="text-primary-foreground/70">Unearth Your Peace</p>
        </Link>

        <Card className="mined-card">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-display text-2xl">Welcome</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline w-full text-right"
                  >
                    Forgot password?
                  </button>

                  <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Full name"
                      value={signupForm.name}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, name: e.target.value }))}
                      className="pl-10"
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password (min 12 chars, A-Z, a-z, 0-9)"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={signupForm.confirmPassword}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="pl-10"
                    />
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    By signing up, you agree to our Terms of Service and Privacy Policy
                  </p>

                  <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create Account'}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-primary-foreground/60 text-sm mt-6">
          Your data is encrypted and secure 🔒
        </p>
      </motion.div>
    </div>
  );
}
