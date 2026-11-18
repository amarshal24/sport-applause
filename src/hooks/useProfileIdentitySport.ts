import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { identitySports } from "@/lib/profileIdentitySport";

export function useProfileIdentitySport(userId: string | undefined) {
  const [selectedSport, setSelectedSport] = useState("mine");
  const [profileSports, setProfileSports] = useState<string[]>([]);
  const [loadedUser, setLoadedUser] = useState<string>();
  useEffect(() => {
    let cancelled = false;
    setSelectedSport("mine");
    setProfileSports([]);
    if (!userId) return;
    supabase.from("profiles").select("sports").eq("id", userId).maybeSingle().then(({ data }) => {
      if (cancelled) return;
      setProfileSports(data?.sports ?? []);
      setLoadedUser(userId);
    });
    return () => { cancelled = true; };
  }, [userId]);
  const sports = useMemo(() => identitySports(selectedSport, profileSports), [selectedSport, profileSports]);
  return { selectedSport, setSelectedSport, sports, ready: !!userId && loadedUser === userId };
}