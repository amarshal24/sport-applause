import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { SPORTS, getSportName } from "@/constants/sports";
import { InlineSportIcon } from "@/components/SportIcon";
import { cn } from "@/lib/utils";
import { useRecentSearches } from "@/hooks/useRecentSearches";


export interface AthleteSuggestion {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  sports: string[] | null;
  role: string | null;
}

interface SportSuggestion {
  kind: "sport";
  id: string;
  name: string;
}

interface Props {
  value?: string;
  onValueChange?: (v: string) => void;
  onSelectSport?: (sportId: string) => void;
  onSelectAthlete?: (athlete: AthleteSuggestion) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

const AthleteSearchAutocomplete = ({
  value,
  onValueChange,
  onSelectSport,
  onSelectAthlete,
  placeholder = "Search athletes by name or sport...",
  className,
  autoFocus,
}: Props) => {
  const navigate = useNavigate();
  const [internal, setInternal] = useState("");
  const query = value !== undefined ? value : internal;
  const setQuery = (v: string) => {
    if (onValueChange) onValueChange(v);
    else setInternal(v);
  };

  const [debounced, setDebounced] = useState("");
  const [people, setPeople] = useState<AthleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { recents, addRecent, clearRecents } = useRecentSearches();


  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (debounced.length < 1) {
        setPeople([]);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, sports, role")
        .or(`username.ilike.%${debounced}%,full_name.ilike.%${debounced}%`)
        .limit(6);
      if (!cancelled) {
        setPeople((data as AthleteSuggestion[]) || []);
        setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const sportMatches: SportSuggestion[] = useMemo(() => {
    const q = debounced.toLowerCase();
    if (!q) return [];
    return SPORTS.filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 4)
      .map((s) => ({ kind: "sport" as const, id: s.id, name: s.name }));
  }, [debounced]);

  const hasQuery = debounced.length > 0;

  const items = useMemo(() => {
    if (!hasQuery) {
      return recents.map((r) =>
        r.type === "sport"
          ? { type: "sport" as const, sport: { kind: "sport" as const, id: r.id, name: r.label }, recent: true }
          : {
              type: "athlete" as const,
              athlete: {
                id: r.id,
                username: r.sublabel || r.label,
                full_name: r.label,
                avatar_url: r.avatar_url ?? null,
                sports: r.sportId ? [r.sportId] : null,
                role: null,
              } as AthleteSuggestion,
              recent: true,
            }
      );
    }
    return [
      ...sportMatches.map((s) => ({ type: "sport" as const, sport: s, recent: false })),
      ...people.map((p) => ({ type: "athlete" as const, athlete: p, recent: false })),
    ];
  }, [hasQuery, recents, sportMatches, people]);

  useEffect(() => setActive(0), [items.length]);

  // Close on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const choose = (index: number) => {
    const item = items[index];
    if (!item) return;
    setOpen(false);
    if (item.type === "sport") {
      addRecent({ type: "sport", id: item.sport.id, label: item.sport.name });
      if (onSelectSport) onSelectSport(item.sport.id);
      else navigate("/fans");
      setQuery("");
    } else {
      addRecent({
        type: "athlete",
        id: item.athlete.id,
        label: item.athlete.full_name || item.athlete.username,
        sublabel: item.athlete.username,
        avatar_url: item.athlete.avatar_url,
        sportId: item.athlete.sports?.[0] ?? null,
      });
      if (onSelectAthlete) onSelectAthlete(item.athlete);
      else navigate(`/athlete/${item.athlete.id}`);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showPanel = open && (hasQuery || items.length > 0);


  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="pl-10 pr-9"
        role="combobox"
        aria-expanded={showPanel}
        aria-autocomplete="list"
      />
      {query && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setQuery("");
            setOpen(false);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {showPanel && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-card/95 backdrop-blur shadow-lg overflow-hidden">
          {!hasQuery && items.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Recent searches
              </span>
              <button
                type="button"
                onClick={() => clearRecents()}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
          )}
          {loading && items.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching...
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No athletes or sports match "{debounced}"
            </div>
          ) : (

            <ul role="listbox" className="max-h-80 overflow-y-auto py-1">
              {items.map((item, i) => (
                <li key={item.type === "sport" ? `s-${item.sport.id}` : `a-${item.athlete.id}`}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(i)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                      i === active ? "bg-accent/10" : "hover:bg-muted/50"
                    )}
                  >
                    {item.type === "sport" ? (
                      <>
                        <span className="p-2 rounded-lg bg-primary/10">
                          <InlineSportIcon sportId={item.sport.id} />
                        </span>
                        <span className="text-sm">
                          Browse{" "}
                          <span className="font-semibold">{item.sport.name}</span> athletes
                        </span>
                      </>
                    ) : (
                      <>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={item.athlete.avatar_url || undefined} alt={item.athlete.username} />
                          <AvatarFallback>
                            {item.athlete.username?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1 text-sm font-medium truncate">
                            {item.athlete.full_name || item.athlete.username}
                            {item.athlete.sports?.[0] && (
                              <InlineSportIcon sportId={item.athlete.sports[0]} />
                            )}
                          </span>
                          <span className="block text-xs text-muted-foreground truncate">
                            @{item.athlete.username}
                            {item.athlete.sports?.[0]
                              ? ` · ${getSportName(item.athlete.sports[0])}`
                              : ""}
                          </span>
                        </span>
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default AthleteSearchAutocomplete;
