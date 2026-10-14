alter table public.content_reports drop constraint content_reports_target_type_check;
alter table public.content_reports add constraint content_reports_target_type_check check (target_type in ('listing','post','profile','comment','recruiting_video','highlight','story'));

create table public.user_suspensions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  reason text,
  suspended_by uuid,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.user_suspensions to authenticated;
alter table public.user_suspensions enable row level security;
create policy "Users see own suspension" on public.user_suspensions for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'moderator'));
create policy "Mods suspend" on public.user_suspensions for insert to authenticated with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'moderator'));
create policy "Mods unsuspend" on public.user_suspensions for delete to authenticated using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'moderator'));

create or replace function public.is_suspended(_user_id uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.user_suspensions where user_id=_user_id) $$;

-- suspended users cannot post
create policy "Suspended cannot post" on public.posts as restrictive for insert to authenticated with check (not public.is_suspended(auth.uid()));
create policy "Suspended cannot comment" on public.post_comments as restrictive for insert to authenticated with check (not public.is_suspended(auth.uid()));
create policy "Suspended cannot upload recruiting" on public.recruiting_videos as restrictive for insert to authenticated with check (not public.is_suspended(auth.uid()));
create policy "Suspended cannot post stories" on public.stories as restrictive for insert to authenticated with check (not public.is_suspended(auth.uid()));
create policy "Suspended cannot add highlights" on public.top_five_videos as restrictive for insert to authenticated with check (not public.is_suspended(auth.uid()));
create policy "Suspended cannot list" on public.marketplace_listings as restrictive for insert to authenticated with check (not public.is_suspended(auth.uid()));
create policy "Suspended cannot message" on public.chat_messages as restrictive for insert to authenticated with check (not public.is_suspended(auth.uid()));

-- moderators can remove content
create policy "Mods remove posts" on public.posts for delete to authenticated using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'moderator'));
create policy "Mods remove comments" on public.post_comments for delete to authenticated using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'moderator'));
create policy "Mods remove recruiting" on public.recruiting_videos for delete to authenticated using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'moderator'));
create policy "Mods remove stories" on public.stories for delete to authenticated using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'moderator'));
create policy "Mods remove highlights" on public.top_five_videos for delete to authenticated using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'moderator'));

-- auto-screen text in posts and comments
create or replace function public.screen_user_text() returns trigger language plpgsql security definer set search_path=public as $$
declare txt text; terms text[] := array['kill yourself','kys','send nudes','nudes','meet me alone','dont tell your parents','don''t tell your parents','snapchat me privately','cashapp me'];
t text; tt text; tid uuid; uid uuid;
begin
  if TG_TABLE_NAME = 'posts' then txt := lower(coalesce(NEW.content,'')); tt := 'post';
  else txt := lower(coalesce(NEW.content,'')); tt := 'comment'; end if;
  foreach t in array terms loop
    if position(t in txt) > 0 then
      insert into public.content_reports(reporter_id,target_type,target_id,reason,details)
      values (NEW.user_id, tt, NEW.id, 'auto_screen', 'Matched flagged phrase: '||t);
      exit;
    end if;
  end loop;
  return NEW;
end $$;
create trigger screen_posts_text after insert or update of content on public.posts for each row execute function public.screen_user_text();
create trigger screen_comments_text after insert or update of content on public.post_comments for each row execute function public.screen_user_text();