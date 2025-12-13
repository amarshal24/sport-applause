import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SPORTS } from "@/constants/sports";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(128),
  username: z.string().trim().min(3, { message: "Username must be at least 3 characters" }).max(50).optional(),
  sports: z.array(z.string()).min(1, { message: "Select at least one sport" }).optional(),
});

const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp, signIn, resetPassword, user } = useAuth();
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

  const getTitle = () => {
    switch (mode) {
      case "signup": return "Create Account";
      case "forgot": return "Reset Password";
      default: return "Welcome Back";
    }
  };

  const getDescription = () => {
    switch (mode) {
      case "signup": return "Sign up to share your sports moments";
      case "forgot": return "Enter your email and we'll send you a reset link";
      default: return "Sign in to continue to USportz";
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
