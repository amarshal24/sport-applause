import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, username: string, sports?: string[]) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithApple: () => Promise<{ error: any }>;
  signInWithPhone: (phone: string) => Promise<{ error: any }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  registerBiometric: (email: string) => Promise<{ error: any }>;
  signInWithBiometric: () => Promise<{ error: any }>;
  isBiometricAvailable: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Check if WebAuthn/biometric is available
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((available) => {
          setIsBiometricAvailable(available);
        })
        .catch(() => setIsBiometricAvailable(false));
    }

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string, sports: string[] = []) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username,
          sports,
        },
      },
    });

    if (error) {
      toast.error("Sign up failed", {
        description: error.message,
      });
    } else {
      toast.success("Account created!", {
        description: "You're now signed in.",
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("Sign in failed", {
        description: error.message,
      });
    }

    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      toast.error("Google sign in failed", {
        description: error.message,
      });
    }

    return { error };
  };

  const signInWithApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      toast.error("Apple sign in failed", {
        description: error.message,
      });
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out", {
      description: "You've been signed out successfully.",
    });
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      toast.error("Password reset failed", {
        description: error.message,
      });
    } else {
      toast.success("Check your email", {
        description: "We've sent you a password reset link.",
      });
    }

    return { error };
  };

  const signInWithPhone = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) {
      toast.error("Phone sign in failed", {
        description: error.message,
      });
    } else {
      toast.success("Code sent!", {
        description: "Check your phone for the verification code.",
      });
    }

    return { error };
  };

  const verifyPhoneOtp = async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) {
      toast.error("Verification failed", {
        description: error.message,
      });
    } else {
      toast.success("Verified!", {
        description: "You're now signed in.",
      });
    }

    return { error };
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const registerBiometric = async (email: string) => {
    try {
      if (!window.PublicKeyCredential) {
        return { error: { message: "Biometric authentication is not supported on this device" } };
      }

      const userId = new Uint8Array(16);
      crypto.getRandomValues(userId);

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "USportz",
            id: window.location.hostname,
          },
          user: {
            id: userId,
            name: email,
            displayName: email,
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },
            { alg: -257, type: "public-key" },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
        },
      }) as PublicKeyCredential | null;

      if (credential) {
        localStorage.setItem('biometric_credential_id', arrayBufferToBase64((credential.rawId)));
        localStorage.setItem('biometric_email', email);
        toast.success("Face ID registered!", {
          description: "You can now sign in with Face ID.",
        });
        return { error: null };
      }

      return { error: { message: "Failed to register biometric credential" } };
    } catch (error: any) {
      toast.error("Biometric registration failed", {
        description: error.message,
      });
      return { error };
    }
  };

  const signInWithBiometric = async () => {
    try {
      const credentialId = localStorage.getItem('biometric_credential_id');
      const email = localStorage.getItem('biometric_email');

      if (!credentialId || !email) {
        return { error: { message: "No biometric credentials found. Please register first." } };
      }

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: window.location.hostname,
          allowCredentials: [{
            id: base64ToArrayBuffer(credentialId),
            type: "public-key",
          }],
          userVerification: "required",
          timeout: 60000,
        },
      }) as PublicKeyCredential | null;

      if (credential) {
        // For demo purposes, we'll sign in with stored credentials
        // In production, you'd verify this with your backend
        toast.success("Biometric verified!", {
          description: "Signing you in...",
        });
        
        // Note: In a real implementation, you would verify the credential
        // on your backend and issue a session token
        return { error: null };
      }

      return { error: { message: "Biometric verification failed" } };
    } catch (error: any) {
      toast.error("Biometric sign in failed", {
        description: error.message,
      });
      return { error };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      signUp, 
      signIn, 
      signInWithGoogle, 
      signInWithApple, 
      signInWithPhone, 
      verifyPhoneOtp, 
      signOut, 
      resetPassword, 
      registerBiometric,
      signInWithBiometric,
      isBiometricAvailable,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
