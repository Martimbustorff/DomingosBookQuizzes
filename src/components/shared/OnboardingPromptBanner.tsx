import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const OnboardingPromptBanner = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const onboardingComplete = localStorage.getItem('onboarding_complete');
    const bannerDismissed = sessionStorage.getItem('onboarding_banner_dismissed');
    
    if (!onboardingComplete && !bannerDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('onboarding_banner_dismissed', 'true');
    setTimeout(() => setIsVisible(false), 300);
  };

  const handleCompleteSetup = () => {
    navigate('/onboarding');
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/20 rounded-lg p-4 mb-6 transition-all duration-300 ${
        isDismissed ? 'opacity-0 translate-y-[-10px]' : 'opacity-100'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 bg-primary/20 rounded-full shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground text-sm sm:text-base">
              Personalize your experience
            </p>
            <p className="text-muted-foreground text-xs sm:text-sm truncate">
              Complete setup to track progress and earn rewards
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            size="sm" 
            onClick={handleCompleteSetup}
            className="whitespace-nowrap"
          >
            Complete Setup
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
