import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authManager } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password confirmation
    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Password and confirm password must match.",
        variant: "destructive",
      });
      return;
    }

    // Validate password length
    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }



    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/auth/signup', {
        firstName,
        lastName,
        email,
        password,
      });
      
      await response.json();
      toast({
        title: "Verify your email",
        description: "We sent you a link to verify your account.",
      });
      setLocation('/login');
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
            Create Your Digital Business Identity
          </p>
        </div>
        
        <Card>
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6 text-center" data-testid="text-create-account">
              Create Account
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">
                    First Name
                  </Label>
                  <Input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="Enter your first name"
                    className="focus:ring-[hsl(var(--asean-blue))] focus:border-[hsl(var(--asean-blue))]"
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">
                    Last Name
                  </Label>
                  <Input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="Enter your last name"
                    className="focus:ring-[hsl(var(--asean-blue))] focus:border-[hsl(var(--asean-blue))]"
                    data-testid="input-last-name"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email address"
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
                  placeholder="Enter your password"
                  className="focus:ring-[hsl(var(--asean-blue))] focus:border-[hsl(var(--asean-blue))]"
                  data-testid="input-password"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm Password
                </Label>
                <Input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
                  className="focus:ring-[hsl(var(--asean-blue))] focus:border-[hsl(var(--asean-blue))]"
                  data-testid="input-confirm-password"
                />
              </div>




              <Button 
                type="submit" 
                disabled={isLoading || !firstName || !lastName || !email || !password || !confirmPassword}
                className="w-full bg-gradient-to-r from-[hsl(var(--asean-green))] to-green-600 hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-105"
                data-testid="button-create-account"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-slate-600">
                Already have an account?{' '}
                <Link href="/login">
                  <Button variant="link" className="text-[hsl(var(--asean-blue))] p-0" data-testid="link-signin">
                    Sign In
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
