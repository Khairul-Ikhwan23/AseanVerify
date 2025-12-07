import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authManager } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === '1') {
      toast({ title: 'Email verified', description: 'You can now log in.' });
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if this is admin login
      if (email === "admin@example.com" && password === "123") {
        const adminUser = {
          id: "admin",
          businessName: "Admin",
          email: "admin@example.com",
          password: "123"
        };
        authManager.setCurrentUser(adminUser);
        setLocation('/admin-approve');
        return;
      }

      const response = await apiRequest('POST', '/api/auth/login', {
        email,
        password,
      });
      
      if (response.ok) {
        const data = await response.json();
        authManager.setCurrentUser(data.user);
        setLocation('/dashboard');
      } else if (response.status === 403) {
        toast({
          title: "Email not verified",
          description: "Please verify your email. You can resend the verification email.",
          variant: "destructive",
        });
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await apiRequest('POST', '/api/auth/resend-verification', {
        email,
      });
      toast({ title: 'Verification email sent (if account exists)' });
    } catch {
      toast({ title: 'Unable to resend verification right now' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-2xl sm:text-4xl font-bold text-[hsl(var(--asean-blue))] mb-2" data-testid="text-title">
            MSME Passport
          </h1>
          <p className="text-base sm:text-lg text-slate-600" data-testid="text-subtitle">
            Your Digital Business Identity
          </p>
        </div>
        
        <Card>
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6 text-center" data-testid="text-welcome">
              Welcome Back
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Business Email
                </Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="focus:ring-[hsl(var(--asean-blue))] focus:border-[hsl(var(--asean-blue))]"
                  data-testid="input-email"
                />
              </div>
              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </Label>
                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="focus:ring-[hsl(var(--asean-blue))] focus:border-[hsl(var(--asean-blue))]"
                  data-testid="input-password"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[hsl(var(--asean-blue))] to-blue-600 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105"
                data-testid="button-signin"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
            <div className="mt-3 text-center">
              <Button type="button" variant="link" onClick={handleResend} disabled={!email}>
                Resend verification email
              </Button>
            </div>
            <div className="mt-6 text-center">
              <p className="text-slate-600">
                Don't have an account?{' '}
                <Link href="/signup">
                  <Button variant="link" className="text-[hsl(var(--asean-blue))] p-0" data-testid="link-signup">
                    Create Account
                  </Button>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
