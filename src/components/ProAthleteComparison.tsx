import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Ruler,
  Weight,
  Trophy,
  Sparkles,
  Loader2,
  Target,
  TrendingUp,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SPORTS } from "@/constants/sports";

interface AthleteMatch {
  name: string;
  team: string;
  height: string;
  weight: string;
  position?: string;
  similarityScore: number;
  explanation: string;
  careerHighlights?: string;
}

interface MatchResult {
  matches: AthleteMatch[];
  overallAnalysis: string;
}

const ProAthleteComparison = () => {
  const [sport, setSport] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [position, setPosition] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);

  // Sport-specific stats
  const [ppg, setPpg] = useState(""); // Points per game (basketball)
  const [rpg, setRpg] = useState(""); // Rebounds per game
  const [apg, setApg] = useState(""); // Assists per game
  const [goals, setGoals] = useState(""); // Goals (soccer)
  const [assists, setAssists] = useState(""); // Assists (soccer/hockey)
  const [battingAvg, setBattingAvg] = useState(""); // Batting average
  const [era, setEra] = useState(""); // ERA (baseball)
  const [passingYards, setPassingYards] = useState(""); // Football
  const [rushingYards, setRushingYards] = useState(""); // Football

  // Athletic performance metrics
  const [verticalJump, setVerticalJump] = useState("");
  const [fortyYardDash, setFortyYardDash] = useState("");
  const [benchPress, setBenchPress] = useState("");
  const [squat, setSquat] = useState("");
  const [shuttleRun, setShuttleRun] = useState("");
  const [broadJump, setBroadJump] = useState("");
  const [wingspan, setWingspan] = useState("");
  const [agility, setAgility] = useState(""); // 3-cone drill

  const getPositionOptions = () => {
    switch (sport) {
      case "Basketball":
        return ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"];
      case "Football":
        return ["Quarterback", "Running Back", "Wide Receiver", "Tight End", "Offensive Line", "Defensive Line", "Linebacker", "Cornerback", "Safety"];
      case "Soccer":
        return ["Goalkeeper", "Center Back", "Full Back", "Defensive Midfielder", "Central Midfielder", "Attacking Midfielder", "Winger", "Striker"];
      case "Baseball":
        return ["Pitcher", "Catcher", "First Base", "Second Base", "Shortstop", "Third Base", "Left Field", "Center Field", "Right Field"];
      case "Hockey":
        return ["Goalie", "Defenseman", "Left Wing", "Center", "Right Wing"];
      default:
        return [];
    }
  };

  const buildStats = () => {
    const stats: Record<string, string | number> = {};
    
    // Sport-specific stats
    if (sport === "Basketball") {
      if (ppg) stats.ppg = parseFloat(ppg);
      if (rpg) stats.rpg = parseFloat(rpg);
      if (apg) stats.apg = parseFloat(apg);
    } else if (sport === "Soccer") {
      if (goals) stats.goals = parseInt(goals);
      if (assists) stats.assists = parseInt(assists);
    } else if (sport === "Baseball") {
      if (battingAvg) stats.battingAverage = parseFloat(battingAvg);
      if (era) stats.era = parseFloat(era);
    } else if (sport === "Football") {
      if (passingYards) stats.passingYards = parseInt(passingYards);
      if (rushingYards) stats.rushingYards = parseInt(rushingYards);
    }

    // Athletic performance metrics (universal)
    if (verticalJump) stats.verticalJump = `${verticalJump} inches`;
    if (fortyYardDash) stats.fortyYardDash = `${fortyYardDash} seconds`;
    if (benchPress) stats.benchPress = `${benchPress} lbs`;
    if (squat) stats.squat = `${squat} lbs`;
    if (shuttleRun) stats.shuttleRun = `${shuttleRun} seconds`;
    if (broadJump) stats.broadJump = `${broadJump} inches`;
    if (wingspan) stats.wingspan = wingspan;
    if (agility) stats.threeCone = `${agility} seconds`;
    
    return Object.keys(stats).length > 0 ? stats : undefined;
  };

  const handleFindMatches = async () => {
    if (!sport || !height || !weight) {
      toast.error("Please fill in sport, height, and weight");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("athlete-matcher", {
        body: {
          athleteData: {
            sport,
            height,
            weight,
            position: position || undefined,
            stats: buildStats(),
          },
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setResult(data);
      toast.success("Found your pro athlete comparisons!");
    } catch (error) {
      console.error("Error finding matches:", error);
      toast.error("Failed to find matches. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSport("");
    setHeight("");
    setWeight("");
    setPosition("");
    setPpg("");
    setRpg("");
    setApg("");
    setGoals("");
    setAssists("");
    setBattingAvg("");
    setEra("");
    setPassingYards("");
    setRushingYards("");
    setVerticalJump("");
    setFortyYardDash("");
    setBenchPress("");
    setSquat("");
    setShuttleRun("");
    setBroadJump("");
    setWingspan("");
    setAgility("");
    setResult(null);
  };

  return (
    <Card className="glass-effect">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Pro Athlete Comparison
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter your stats to find professional athletes with similar profiles
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!result ? (
          <>
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sport *</Label>
                <Select value={sport} onValueChange={(v) => { setSport(v); setPosition(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORTS.map((s) => (
                      <SelectItem key={s.id} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {sport && getPositionOptions().length > 0 && (
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select value={position} onValueChange={setPosition}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {getPositionOptions().map((pos) => (
                        <SelectItem key={pos} value={pos}>
                          {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Physical Attributes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  Height *
                </Label>
                <Input
                  placeholder='e.g., 6&apos;2"'
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Weight className="w-4 h-4" />
                  Weight *
                </Label>
                <Input
                  placeholder="e.g., 185 lbs"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </div>

            {/* Sport-specific Stats */}
            {sport && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Your Stats (Optional)
                  </h4>
                  
                  {sport === "Basketball" && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>PPG</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Points/game"
                          value={ppg}
                          onChange={(e) => setPpg(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>RPG</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Rebounds/game"
                          value={rpg}
                          onChange={(e) => setRpg(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>APG</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Assists/game"
                          value={apg}
                          onChange={(e) => setApg(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {sport === "Soccer" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Goals (Season)</Label>
                        <Input
                          type="number"
                          placeholder="Goals scored"
                          value={goals}
                          onChange={(e) => setGoals(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Assists (Season)</Label>
                        <Input
                          type="number"
                          placeholder="Assists"
                          value={assists}
                          onChange={(e) => setAssists(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {sport === "Baseball" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Batting Average</Label>
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="e.g., 0.285"
                          value={battingAvg}
                          onChange={(e) => setBattingAvg(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>ERA (Pitchers)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g., 3.45"
                          value={era}
                          onChange={(e) => setEra(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {sport === "Football" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Passing Yards</Label>
                        <Input
                          type="number"
                          placeholder="Season yards"
                          value={passingYards}
                          onChange={(e) => setPassingYards(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rushing Yards</Label>
                        <Input
                          type="number"
                          placeholder="Season yards"
                          value={rushingYards}
                          onChange={(e) => setRushingYards(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Athletic Performance Metrics */}
                <Separator className="my-4" />
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Athletic Performance (Optional)
                  </h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Vertical Jump</Label>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="inches"
                        value={verticalJump}
                        onChange={(e) => setVerticalJump(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>40-Yard Dash</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="seconds"
                        value={fortyYardDash}
                        onChange={(e) => setFortyYardDash(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bench Press</Label>
                      <Input
                        type="number"
                        placeholder="lbs"
                        value={benchPress}
                        onChange={(e) => setBenchPress(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Squat</Label>
                      <Input
                        type="number"
                        placeholder="lbs"
                        value={squat}
                        onChange={(e) => setSquat(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Broad Jump</Label>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="inches"
                        value={broadJump}
                        onChange={(e) => setBroadJump(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Shuttle Run</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="seconds"
                        value={shuttleRun}
                        onChange={(e) => setShuttleRun(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>3-Cone Drill</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="seconds"
                        value={agility}
                        onChange={(e) => setAgility(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Wingspan</Label>
                      <Input
                        placeholder='e.g., 6&apos;8"'
                        value={wingspan}
                        onChange={(e) => setWingspan(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <Button
              onClick={handleFindMatches}
              disabled={isLoading || !sport || !height || !weight}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Finding Your Pro Comparisons...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Find My Pro Comparisons
                </>
              )}
            </Button>
          </>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Overall Analysis */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-primary" />
                  Your Profile Analysis
                </h4>
                <p className="text-sm text-muted-foreground">{result.overallAnalysis}</p>
              </div>

              {/* Matches */}
              <div className="space-y-4">
                <h4 className="font-semibold">Your Pro Comparisons</h4>
                {result.matches.map((match, index) => (
                  <motion.div
                    key={match.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-lg">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h5 className="font-semibold text-lg">{match.name}</h5>
                              <Badge 
                                variant={match.similarityScore >= 80 ? "default" : match.similarityScore >= 60 ? "secondary" : "outline"}
                                className="flex-shrink-0"
                              >
                                <Star className="w-3 h-3 mr-1" />
                                {match.similarityScore}% Match
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{match.team}</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge variant="outline" className="text-xs">
                                <Ruler className="w-3 h-3 mr-1" />
                                {match.height}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <Weight className="w-3 h-3 mr-1" />
                                {match.weight}
                              </Badge>
                              {match.position && (
                                <Badge variant="outline" className="text-xs">
                                  {match.position}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{match.explanation}</p>
                            {match.careerHighlights && (
                              <div className="mt-2 p-2 rounded bg-muted/50">
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Trophy className="w-3 h-3" />
                                  {match.careerHighlights}
                                </p>
                              </div>
                            )}
                            <div className="mt-3">
                              <Progress value={match.similarityScore} className="h-2" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              <Button variant="outline" onClick={resetForm} className="w-full">
                Compare Another Athlete
              </Button>
            </motion.div>
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
};

export default ProAthleteComparison;
