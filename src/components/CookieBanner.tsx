
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Cookie, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const cookieChoice = localStorage.getItem('cookie-consent');
    if (!cookieChoice) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="mx-auto max-w-4xl border-2 shadow-lg bg-background/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Cookie className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium mb-1">Cookies</p>
                <p className="text-muted-foreground">
                  We use cookies to improve your experience and for analysis. You can deactivate them anytime.
                  <Link to="/cookie-policy" className="text-primary hover:underline ml-1">
                    Learn more in our Cookie Policy
                  </Link>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDecline}
                className="text-xs"
              >
                Decline
              </Button>
              <Button
                size="sm"
                onClick={handleAccept}
                className="text-xs"
              >
                Accept
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="p-1 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CookieBanner;
