import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { SPORTS } from "@/constants/sports";
import { z } from "zod";
import { Phone, Mail } from "lucide-react";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(128),
  username: z.string().trim().min(3, { message: "Username must be at least 3 characters" }).max(50).optional(),
  sports: z.array(z.string()).min(1, { message: "Select at least one sport" }).optional(),
});

const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp, signIn, signInWithGoogle, signInWithApple, signInWithPhone, verifyPhoneOtp, resetPassword, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      if (mode === "forgot") {
        const emailResult = z.string().trim().email().safeParse(email);
        if (!emailResult.success) {
          setErrors({ email: "Please enter a valid email address" });
          setIsSubmitting(false);
          return;
        }
        await resetPassword(email);
        setMode("signin");
        setIsSubmitting(false);
        return;
      }

      const data = mode === "signup"
        ? { email, password, username, sports: selectedSports }
        : { email, password };

      const result = authSchema.safeParse(data);
      
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        setIsSubmitting(false);
        return;
      }

      if (mode === "signup") {
        await signUp(email, password, username, selectedSports);
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      if (!otpSent) {
        const phoneRegex = /^\+?[1-9]\d{9,14}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
          setErrors({ phone: "Please enter a valid phone number with country code (e.g., +1234567890)" });
          setIsSubmitting(false);
          return;
        }
        
        const { error } = await signInWithPhone(phone);
        if (!error) {
          setOtpSent(true);
        }
      } else {
        if (otp.length !== 6) {
          setErrors({ otp: "Please enter the 6-digit code" });
          setIsSubmitting(false);
          return;
        }
        
        await verifyPhoneOtp(phone, otp);
      }
    } catch (error) {
      console.error("Phone auth error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (authMethod === "phone" && mode === "signin") {
      return otpSent ? "Enter Verification Code" : "Phone Sign In";
    }
    switch (mode) {
      case "signup": return "Create Account";
      case "forgot": return "Reset Password";
      default: return "Welcome Back";
    }
  };

  const getDescription = () => {
    if (authMethod === "phone" && mode === "signin") {
      return otpSent 
        ? `We sent a code to ${phone}` 
        : "Enter your phone number to receive a verification code";
    }
    switch (mode) {
      case "signup": return "Sign up to share your sports moments";
      case "forgot": return "Enter your email and we'll send you a reset link";
      default: return "Sign in to continue to USportz";
    }
  };

  const switchToEmailTab = () => {
    setAuthMethod("email");
    setOtpSent(false);
    setOtp("");
  };

  const switchToPhoneTab = () => {
    setAuthMethod("phone");
    setOtpSent(false);
    setOtp("");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "signin" && (
            <Tabs value={authMethod} className="mb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email" onClick={switchToEmailTab} className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone" onClick={switchToPhoneTab} className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {authMethod === "phone" && mode === "signin" ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              {!otpSent ? (
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1">{errors.phone}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Include country code (e.g., +1 for US)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Label>Verification Code</Label>
                  <div className="flex justify-center">
                    <InputOTP value={otp} onChange={setOtp} maxLength={6}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {errors.otp && (
                    <p className="text-sm text-destructive text-center">{errors.otp}</p>
                  )}
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm"
                    onClick={() => { setOtpSent(false); setOtp(""); }}
                  >
                    Change phone number
                  </Button>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : otpSent ? "Verify Code" : "Send Code"}
              </Button>

              {/* Social Login for Phone Tab */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => signInWithGoogle()}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => signInWithApple()}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Apple
                </Button>
              </div>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setMode("signup")}
              >
                Don't have an account? Sign up
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="athlete123"
                    maxLength={50}
                  />
                  {errors.username && (
                    <p className="text-sm text-destructive mt-1">{errors.username}</p>
                  )}
                </div>
              )}

              {mode === "signup" && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    What sports do you play? (Select at least one)
                  </Label>
                  <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2 border rounded-md">
                    {SPORTS.map((sport) => {
                      const Icon = sport.icon;
                      return (
                        <div key={sport.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={sport.id}
                            checked={selectedSports.includes(sport.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedSports([...selectedSports, sport.id]);
                              } else {
                                setSelectedSports(selectedSports.filter(s => s !== sport.id));
                              }
                            }}
                          />
                          <Label
                            htmlFor={sport.id}
                            className="flex items-center gap-2 cursor-pointer text-sm"
                          >
                            <Icon className="w-4 h-4" />
                            {sport.name}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                  {errors.sports && (
                    <p className="text-sm text-destructive mt-1">{errors.sports}</p>
                  )}
                </div>
              )}
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  maxLength={255}
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              {mode !== "forgot" && (
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    maxLength={128}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive mt-1">{errors.password}</p>
                  )}
                </div>
              )}

              {mode === "signin" && (
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm text-muted-foreground"
                  onClick={() => setMode("forgot")}
                >
                  Forgot your password?
                </Button>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? "Processing..." 
                  : mode === "signup" 
                    ? "Sign Up" 
                    : mode === "forgot" 
                      ? "Send Reset Link" 
                      : "Sign In"}
              </Button>

              {mode !== "forgot" && (
                <>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => signInWithGoogle()}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => signInWithApple()}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      Apple
                    </Button>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-2">
                {mode === "forgot" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setMode("signin")}
                  >
                    Back to Sign In
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                  >
                    {mode === "signup" 
                      ? "Already have an account? Sign in" 
                      : "Don't have an account? Sign up"}
                  </Button>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;