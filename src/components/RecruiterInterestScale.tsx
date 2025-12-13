import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface RecruiterInterestScaleProps {
  athleteId: string;
}

const interestLabels = ['Not Interested', 'Slightly Interested', 'Interested', 'Very Interested', 'Highly Interested'];

export function RecruiterInterestScale({ athleteId }: RecruiterInterestScaleProps) {
  const [interestLevel, setInterestLevel] = useState<number>(0);
  const [hoveredLevel, setHoveredLevel] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [existingInterest, setExistingInterest] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuthAndFetchInterest = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      if (user) {
        const { data } = await supabase
          .from('recruiter_interests')
          .select('*')
          .eq('recruiter_id', user.id)
          .eq('athlete_id', athleteId)
          .maybeSingle();
        
        if (data) {
          setInterestLevel(data.interest_level);
          setNotes(data.notes || '');
          setExistingInterest(data.id);
        }
      }
    };

    checkAuthAndFetchInterest();
  }, [athleteId]);

  const handleSave = async () => {
    if (interestLevel === 0) {
      toast({
        title: 'Select Interest Level',
        description: 'Please select your interest level before saving.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to save your interest.',
        variant: 'destructive',
      });
      setIsSaving(false);
      return;
    }

    try {
      if (existingInterest) {
        await supabase
          .from('recruiter_interests')
          .update({
            interest_level: interestLevel,
            notes: notes || null,
          })
          .eq('id', existingInterest);
      } else {
        const { data } = await supabase
          .from('recruiter_interests')
          .insert({
            recruiter_id: user.id,
            athlete_id: athleteId,
            interest_level: interestLevel,
            notes: notes || null,
          })
          .select()
          .single();
        
        if (data) {
          setExistingInterest(data.id);
        }
      }

      toast({
        title: 'Interest Saved',
        description: 'Your interest level has been recorded.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save interest. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const displayLevel = hoveredLevel || interestLevel;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          Recruiter Interest
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex gap-1 justify-center">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setInterestLevel(level)}
                onMouseEnter={() => setHoveredLevel(level)}
                onMouseLeave={() => setHoveredLevel(0)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  className={cn(
                    'h-8 w-8 transition-colors',
                    level <= displayLevel
                      ? 'fill-primary text-primary'
                      : 'text-muted-foreground'
                  )}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground min-h-[20px]">
            {displayLevel > 0 ? interestLabels[displayLevel - 1] : 'Select your interest level'}
          </p>
        </div>

        <Textarea
          placeholder="Add notes about this athlete (optional)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="resize-none"
          rows={3}
        />

        <Button 
          onClick={handleSave} 
          disabled={isSaving || interestLevel === 0}
          className="w-full"
        >
          {isSaving ? 'Saving...' : existingInterest ? 'Update Interest' : 'Save Interest'}
        </Button>
      </CardContent>
    </Card>
  );
}
