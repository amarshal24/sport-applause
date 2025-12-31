import { useState, useEffect } from "react";
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
  ArrowUp,
  ArrowDown,
  Minus,
  History,
  Save,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Combine benchmark averages by sport
const COMBINE_BENCHMARKS: Record<string, {
  label: string;
  metrics: {
    verticalJump?: { avg: number; elite: number; unit: string };
    fortyYardDash?: { avg: number; elite: number; unit: string };
    benchPress?: { avg: number; elite: number; unit: string };
    broadJump?: { avg: number; elite: number; unit: string };
    shuttleRun?: { avg: number; elite: number; unit: string };
    threeCone?: { avg: number; elite: number; unit: string };
  };
}> = {
  Football: {
    label: "NFL Combine",
    metrics: {
      verticalJump: { avg: 33, elite: 40, unit: "in" },
      fortyYardDash: { avg: 4.65, elite: 4.35, unit: "s" },
      benchPress: { avg: 225, elite: 30, unit: "reps" }, // 225lb bench reps
      broadJump: { avg: 118, elite: 130, unit: "in" },
      shuttleRun: { avg: 4.35, elite: 4.0, unit: "s" },
      threeCone: { avg: 7.1, elite: 6.7, unit: "s" },
    },
  },
  Basketball: {
    label: "NBA Draft Combine",
    metrics: {
      verticalJump: { avg: 32, elite: 40, unit: "in" },
      fortyYardDash: { avg: 3.35, elite: 3.1, unit: "s" }, // 3/4 court sprint
      benchPress: { avg: 185, elite: 15, unit: "reps" },
      broadJump: { avg: 110, elite: 125, unit: "in" },
      shuttleRun: { avg: 3.2, elite: 2.9, unit: "s" }, // Lane agility
    },
  },
  Baseball: {
    label: "MLB Combine",
    metrics: {
      fortyYardDash: { avg: 4.5, elite: 4.2, unit: "s" }, // 60-yard dash time/1.5
    },
  },
  Soccer: {
    label: "MLS Combine",
    metrics: {
      verticalJump: { avg: 26, elite: 32, unit: "in" },
      fortyYardDash: { avg: 4.7, elite: 4.4, unit: "s" },
      shuttleRun: { avg: 4.5, elite: 4.1, unit: "s" },
    },
  },
};
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

interface ComparisonHistoryItem {
  id: string;
  sport: string;
  height: string;
  weight: string;
  position: string | null;
  stats: Record<string, unknown>;
  matches: AthleteMatch[];
  overall_analysis: string | null;
  created_at: string;
}

const ProAthleteComparison = () => {
  const [sport, setSport] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [position, setPosition] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  
  // History state
  const [history, setHistory] = useState<ComparisonHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

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

  // Check auth and load history
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id ?? null);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load history when user is authenticated and history panel is opened
  useEffect(() => {
    if (userId && showHistory) {
      loadHistory();
    }
  }, [userId, showHistory]);

  const loadHistory = async () => {
    if (!userId) return;
    
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("comparison_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setHistory(data as unknown as ComparisonHistoryItem[] || []);
    } catch (error) {
      console.error("Error loading history:", error);
      toast.error("Failed to load comparison history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveToHistory = async () => {
    if (!userId || !result) {
      toast.error("Please sign in to save comparisons");
      return;
    }

    setIsSaving(true);
    try {
      const insertData = {
        user_id: userId,
        sport,
        height,
        weight,
        position: position || null,
        stats: buildStats() || {},
        matches: JSON.parse(JSON.stringify(result.matches)),
        overall_analysis: result.overallAnalysis,
      };
      const { error } = await supabase.from("comparison_history").insert([insertData] as never);

      if (error) throw error;
      toast.success("Comparison saved to history!");
      if (showHistory) loadHistory();
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save comparison");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteFromHistory = async (id: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("comparison_history")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;
      setHistory((prev) => prev.filter((item) => item.id !== id));
      toast.success("Comparison deleted");
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete comparison");
    }
  };

  const loadFromHistory = (item: ComparisonHistoryItem) => {
    setResult({
      matches: item.matches,
      overallAnalysis: item.overall_analysis || "",
    });
    setSport(item.sport);
    setHeight(item.height);
    setWeight(item.weight);
    setPosition(item.position || "");
    setShowHistory(false);
  };

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Pro Athlete Comparison
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your stats to find professional athletes with similar profiles
            </p>
          </div>
          {userId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              History
              {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* History Panel */}
        <AnimatePresence>
          {showHistory && userId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-xl bg-muted/30 border border-border mb-4">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4" />
                  Recent Comparisons
                </h4>
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No saved comparisons yet. Run a comparison and save it!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors group"
                      >
                        <button
                          onClick={() => loadFromHistory(item)}
                          className="flex-1 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {item.sport}
                            </Badge>
                            {item.position && (
                              <Badge variant="outline" className="text-xs">
                                {item.position}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <span>{item.height} • {item.weight}</span>
                            <span>•</span>
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.matches.length} pro matches found
                          </div>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFromHistory(item.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

                  {/* Combine Benchmark Comparison */}
                  {COMBINE_BENCHMARKS[sport] && (verticalJump || fortyYardDash || benchPress || broadJump || shuttleRun || agility) && (
                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-muted/30 border border-primary/10">
                      <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-primary" />
                        {COMBINE_BENCHMARKS[sport].label} Comparison
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {verticalJump && COMBINE_BENCHMARKS[sport].metrics.verticalJump && (() => {
                          const val = parseFloat(verticalJump);
                          const bench = COMBINE_BENCHMARKS[sport].metrics.verticalJump!;
                          const diff = val - bench.avg;
                          const isElite = val >= bench.elite;
                          return (
                            <div className={`p-3 rounded-lg border ${isElite ? 'bg-green-500/10 border-green-500/30' : diff >= 0 ? 'bg-primary/10 border-primary/20' : 'bg-muted/50 border-muted'}`}>
                              <div className="text-xs text-muted-foreground mb-1">Vertical Jump</div>
                              <div className="flex items-center justify-between">
                                <span className="font-semibold">{val}{bench.unit}</span>
                                <div className={`flex items-center gap-1 text-xs ${isElite ? 'text-green-500' : diff >= 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                                  {diff > 0 ? <ArrowUp className="w-3 h-3" /> : diff < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                  {Math.abs(diff).toFixed(1)} vs avg
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Avg: {bench.avg}{bench.unit} | Elite: {bench.elite}{bench.unit}+
                              </div>
                              {isElite && <Badge className="mt-2 text-xs bg-green-500">Elite Level</Badge>}
                            </div>
                          );
                        })()}

                        {fortyYardDash && COMBINE_BENCHMARKS[sport].metrics.fortyYardDash && (() => {
                          const val = parseFloat(fortyYardDash);
                          const bench = COMBINE_BENCHMARKS[sport].metrics.fortyYardDash!;
                          const diff = bench.avg - val; // Lower is better
                          const isElite = val <= bench.elite;
                          return (
                            <div className={`p-3 rounded-lg border ${isElite ? 'bg-green-500/10 border-green-500/30' : diff >= 0 ? 'bg-primary/10 border-primary/20' : 'bg-muted/50 border-muted'}`}>
                              <div className="text-xs text-muted-foreground mb-1">40-Yard Dash</div>
                              <div className="flex items-center justify-between">
                                <span className="font-semibold">{val}{bench.unit}</span>
                                <div className={`flex items-center gap-1 text-xs ${isElite ? 'text-green-500' : diff >= 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                                  {diff > 0 ? <ArrowUp className="w-3 h-3" /> : diff < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                  {Math.abs(diff).toFixed(2)}s vs avg
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Avg: {bench.avg}{bench.unit} | Elite: {bench.elite}{bench.unit}
                              </div>
                              {isElite && <Badge className="mt-2 text-xs bg-green-500">Elite Level</Badge>}
                            </div>
                          );
                        })()}

                        {broadJump && COMBINE_BENCHMARKS[sport].metrics.broadJump && (() => {
                          const val = parseFloat(broadJump);
                          const bench = COMBINE_BENCHMARKS[sport].metrics.broadJump!;
                          const diff = val - bench.avg;
                          const isElite = val >= bench.elite;
                          return (
                            <div className={`p-3 rounded-lg border ${isElite ? 'bg-green-500/10 border-green-500/30' : diff >= 0 ? 'bg-primary/10 border-primary/20' : 'bg-muted/50 border-muted'}`}>
                              <div className="text-xs text-muted-foreground mb-1">Broad Jump</div>
                              <div className="flex items-center justify-between">
                                <span className="font-semibold">{val}{bench.unit}</span>
                                <div className={`flex items-center gap-1 text-xs ${isElite ? 'text-green-500' : diff >= 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                                  {diff > 0 ? <ArrowUp className="w-3 h-3" /> : diff < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                  {Math.abs(diff).toFixed(1)} vs avg
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Avg: {bench.avg}{bench.unit} | Elite: {bench.elite}{bench.unit}+
                              </div>
                              {isElite && <Badge className="mt-2 text-xs bg-green-500">Elite Level</Badge>}
                            </div>
                          );
                        })()}

                        {shuttleRun && COMBINE_BENCHMARKS[sport].metrics.shuttleRun && (() => {
                          const val = parseFloat(shuttleRun);
                          const bench = COMBINE_BENCHMARKS[sport].metrics.shuttleRun!;
                          const diff = bench.avg - val; // Lower is better
                          const isElite = val <= bench.elite;
                          return (
                            <div className={`p-3 rounded-lg border ${isElite ? 'bg-green-500/10 border-green-500/30' : diff >= 0 ? 'bg-primary/10 border-primary/20' : 'bg-muted/50 border-muted'}`}>
                              <div className="text-xs text-muted-foreground mb-1">Shuttle Run</div>
                              <div className="flex items-center justify-between">
                                <span className="font-semibold">{val}{bench.unit}</span>
                                <div className={`flex items-center gap-1 text-xs ${isElite ? 'text-green-500' : diff >= 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                                  {diff > 0 ? <ArrowUp className="w-3 h-3" /> : diff < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                  {Math.abs(diff).toFixed(2)}s vs avg
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Avg: {bench.avg}{bench.unit} | Elite: {bench.elite}{bench.unit}
                              </div>
                              {isElite && <Badge className="mt-2 text-xs bg-green-500">Elite Level</Badge>}
                            </div>
                          );
                        })()}

                        {agility && COMBINE_BENCHMARKS[sport].metrics.threeCone && (() => {
                          const val = parseFloat(agility);
                          const bench = COMBINE_BENCHMARKS[sport].metrics.threeCone!;
                          const diff = bench.avg - val; // Lower is better
                          const isElite = val <= bench.elite;
                          return (
                            <div className={`p-3 rounded-lg border ${isElite ? 'bg-green-500/10 border-green-500/30' : diff >= 0 ? 'bg-primary/10 border-primary/20' : 'bg-muted/50 border-muted'}`}>
                              <div className="text-xs text-muted-foreground mb-1">3-Cone Drill</div>
                              <div className="flex items-center justify-between">
                                <span className="font-semibold">{val}{bench.unit}</span>
                                <div className={`flex items-center gap-1 text-xs ${isElite ? 'text-green-500' : diff >= 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                                  {diff > 0 ? <ArrowUp className="w-3 h-3" /> : diff < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                  {Math.abs(diff).toFixed(2)}s vs avg
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Avg: {bench.avg}{bench.unit} | Elite: {bench.elite}{bench.unit}
                              </div>
                              {isElite && <Badge className="mt-2 text-xs bg-green-500">Elite Level</Badge>}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
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

              <div className="flex gap-2">
                {userId && (
                  <Button
                    variant="secondary"
                    onClick={saveToHistory}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save to History
                  </Button>
                )}
                <Button variant="outline" onClick={resetForm} className="flex-1">
                  Compare Another Athlete
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
};

export default ProAthleteComparison;
