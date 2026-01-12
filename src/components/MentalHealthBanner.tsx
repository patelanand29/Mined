import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Clock, Phone, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useMentalHealthMonitor } from '@/hooks/useMentalHealthMonitor';
import { useNavigate } from 'react-router-dom';

export default function MentalHealthBanner() {
  const navigate = useNavigate();
  const { latestAlert, getRiskLevelInfo, hasMotivationalCapsule } = useMentalHealthMonitor();
  const [dismissed, setDismissed] = useState(false);

  // Check if alert is recent (within last 24 hours)
  const isRecentAlert = latestAlert && 
    new Date().getTime() - new Date(latestAlert.created_at).getTime() < 24 * 60 * 60 * 1000;

  // Only show for high/critical AND if capsule was unlocked
  const shouldShow = latestAlert && 
    (latestAlert.risk_level === 'high' || latestAlert.risk_level === 'critical') &&
    latestAlert.capsule_unlocked &&
    isRecentAlert &&
    !dismissed;

  if (!shouldShow) return null;

  const riskInfo = getRiskLevelInfo(latestAlert.risk_level);
  
  // Theme-aware styling based on risk level
  const isHighRisk = latestAlert.risk_level === 'critical';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6"
      >
        <Card className={`p-4 border-l-4 ${isHighRisk ? 'border-destructive bg-destructive/10' : 'border-primary bg-primary/10'}`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Heart className={`w-6 h-6 ${isHighRisk ? 'text-destructive' : 'text-primary'}`} />
            </div>
            
            <div className="flex-1">
              <h3 className={`font-semibold ${isHighRisk ? 'text-destructive' : 'text-primary'}`}>
                {latestAlert.risk_level === 'critical' 
                  ? "We're here for you" 
                  : "A message from your past self awaits"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {latestAlert.analysis_summary || 
                  "We've noticed some patterns in your recent entries. A special message has been unlocked for you."}
              </p>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {hasMotivationalCapsule && (
                  <Button 
                    size="sm" 
                    onClick={() => navigate('/time-capsule')}
                    className="gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    View Your Message
                  </Button>
                )}
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate('/counsellors')}
                  className="gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Talk to Someone
                </Button>

                {latestAlert.risk_level === 'critical' && (
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => window.open('https://www.nimhans.ac.in/', '_blank')}
                    className="gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Crisis Resources
                  </Button>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDismissed(true)}
              className="flex-shrink-0 h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
