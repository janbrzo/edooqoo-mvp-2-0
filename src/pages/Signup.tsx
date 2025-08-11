
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { EmailConfirmationModal } from '@/components/EmailConfirmationModal';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [schoolInstitution, setSchoolInstitution] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error", 
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: firstName,
            last_name: lastName,
            school_institution: schoolInstitution
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      if (data?.user && !data.session) {
        // Email confirmation required
        setRegisteredEmail(email);
        setShowEmailModal(true);
        console.log('Account created, email confirmation required');
      } else if (data?.session) {
        // Immediate login (shouldn't happen with email confirmation enabled)
        toast({
          title: "Success",
          description: "Account created and signed in successfully!",
        });
        navigate('/');
      }

    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-worksheet-purple/20 to-worksheet-teal/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Join thousands of English teachers creating amazing worksheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <GoogleSignInButton mode="signup" disabled={loading} />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              
              <Input
                type="text"
                placeholder="School/Institution (Optional)"
                value={schoolInstitution}
                onChange={(e) => setSchoolInstitution(e.target.value)}
              />
              
              <Input
                type="password"
                placeholder="Password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              
              <Button 
                type="submit" 
                className="w-full bg-worksheet-purple hover:bg-worksheet-purpleDark"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-worksheet-purple hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <EmailConfirmationModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        email={registeredEmail}
      />
    </div>
  );
};

export default Signup;
