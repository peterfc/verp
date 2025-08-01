"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserClient } from "@supabase/ssr";

export default function SetupPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get the auth parameters from URL
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const error_description = searchParams.get("error_description");
  const email = searchParams.get("email");
  
  // The actual token for password reset might be in different parameters
  const resetToken = token_hash || code;

  // Debug: log all URL parameters
  useEffect(() => {
    console.log("URL parameters:", {
      code,
      token_hash,
      type,
      error_description,
      email,
      allParams: Object.fromEntries(searchParams.entries())
    });
  }, [code, token_hash, type, error_description, email, searchParams]);

  // Handle authentication on page load if token is present
  useEffect(() => {
    const handleAuthOnLoad = async () => {
      if (resetToken && !success && !loading) {
        console.log("Reset token present on page load:", resetToken);
        
        try {
          // For password reset flows, we don't need to exchange the code manually
          // The token will be used when we call verifyOtp() with the new password
          // Just verify that we have the necessary parameters
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            console.log("User already has active session:", session.user.email);
          } else {
            console.log("No active session, will authenticate when password is set");
          }
          
        } catch (err: any) {
          console.error("Auth error:", err);
          setError("Authentication failed. Please try again.");
        }
      }
    };

    handleAuthOnLoad();
  }, [resetToken, success, loading, supabase.auth]);

  useEffect(() => {
    if (error_description) {
      setError(decodeURIComponent(error_description));
    }
  }, [error_description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetToken) {
      setError("Invalid or expired setup link. Please request a new invitation.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Starting password setup process with token:", resetToken);
      console.log("URL type parameter:", type);
      console.log("All URL params:", Object.fromEntries(searchParams.entries()));
      
      // Try client-side approach first
      let clientSuccess = false;
      
      try {
        // Different approaches based on the URL parameters we receive
        if (type === 'recovery' && resetToken) {
          // This is a password recovery flow
          console.log("Using recovery flow with token_hash");
          
          const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: resetToken,
            type: 'recovery'
          });

          if (verifyError) {
            console.error("Error verifying recovery OTP:", verifyError);
            throw verifyError;
          }

          console.log("Recovery OTP verified successfully:", verifyData);
        } else {
          // Try alternative approach - check if there's already a session from the URL
          console.log("Checking for existing session from URL parameters");
          
          // For some password reset flows, the session might already be established
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (!session) {
            // If no session, try to establish one using the code
            if (code) {
              console.log("Attempting to use code for session establishment");
              
              const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
                token_hash: code,
                type: 'recovery'
              });
              
              if (verifyError) {
                throw verifyError;
              }
              
              console.log("Code verified successfully:", verifyData);
            } else {
              throw new Error("No valid authentication token found");
            }
          } else {
            console.log("Using existing session:", session.user.email);
          }
        }

        // Now update the user's password
        const { data: updateData, error: updateError } = await supabase.auth.updateUser({
          password: password
        });

        if (updateError) {
          console.error("Error updating password:", updateError);
          throw updateError;
        }

        console.log("Password updated successfully via client auth:", updateData);
        clientSuccess = true;
        
      } catch (clientError) {
        console.warn("Client-side approach failed, falling back to server API:", clientError);
        
        // Fallback to server-side approach
        const response = await fetch('/api/setup-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: resetToken,
            password: password,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to set password via server API');
        }

        const serverData = await response.json();
        console.log("Password set successfully via server API:", serverData);
        clientSuccess = true; // Mark as successful even though we used server API
      }

      if (clientSuccess) {
        // Call our API to update the profile needs_password_setup flag
        const profileResponse = await fetch('/api/setup-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            markComplete: true  // Just flag to mark password setup as complete
          }),
        });

        if (!profileResponse.ok) {
          console.warn("Failed to update profile flag, but password was set successfully");
          // Don't fail the whole process for this
        } else {
          const data2 = await profileResponse.json();
          console.log("Profile updated:", data2);
        }

        setSuccess(true);
        
        // Ensure user is logged out and redirect to login page with success message
        await supabase.auth.signOut();
        
        setTimeout(() => {
          router.push("/login?passwordSetup=success");
        }, 2000);
      } else {
        throw new Error("Failed to set password using any available method");
      }

    } catch (err: any) {
      console.error("Password setup error:", err);
      setError(err.message || "Failed to set up password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-green-600 text-lg font-semibold">
                ✅ Password Set Successfully!
              </div>
              <p className="text-sm text-gray-600">
                Your password has been set. Redirecting to login page...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Set Your Password</CardTitle>
          <p className="text-sm text-gray-600 text-center">
            Create a password for your account
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                disabled={loading}
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !resetToken}
            >
              {loading ? "Setting up..." : "Set Password"}
            </Button>
            {!resetToken && (
              <p className="text-sm text-red-600 text-center">
                Invalid setup link. Please request a new invitation.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
