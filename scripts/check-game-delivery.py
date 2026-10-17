import asyncio,json,os,time
from pathlib import Path
from playwright.async_api import async_playwright

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  context=await browser.new_context(viewport={"width":1280,"height":1800})
  page=await context.new_page()
  with open(os.path.expanduser('~/.cache/lovable-auth/session.json')) as f: minted=json.load(f)
  await page.goto('http://localhost:8080')
  await page.evaluate('([k,v])=>localStorage.setItem(k,v)',[minted['storage_key'],json.dumps(minted['session'])])
  test_title='Protected Delivery Test '+str(time.time_ns())
  await page.goto('http://localhost:8080/games')
  await page.get_by_role('button',name='List your game').click()
  await page.get_by_label('Game title',exact=True).fill(test_title)
  await page.get_by_label('Description',exact=True).fill('Isolated authorization test; not a real game for sale.')
  await page.get_by_label('Price (USD)').fill('4.99')
  await page.get_by_label('Hosted game URL').fill('https://example.org/game')
  await page.get_by_role('button',name='Submit for review',exact=True).click()
  await page.get_by_role('tab',name='My games',exact=True).click()
  card=page.get_by_role('article').filter(has=page.get_by_role('heading',name=test_title,exact=True))
  await card.get_by_role('button',name='Protected delivery',exact=True).click()
  await page.get_by_role('button',name='Create host key',exact=True).click()
  await page.get_by_label('Private host key · shown once').wait_for()
  hostkey=await page.get_by_label('Private host key · shown once').input_value()
  async def host_verify(args):
   response=await context.request.post(args['url'],headers={'X-Game-Host-Key':args['key'],'Content-Type':'application/json','apikey':args['apikey']},data=json.dumps(args['body']))
   data=await response.json()
   return {'data':data,'error': None if response.ok else {'message':data.get('error','Verification refused')}}
  await page.expose_function('hostVerify',host_verify)
  result=await page.evaluate('''async ({hostKey,testTitle})=>{
   const {supabase:s}=await import('/src/integrations/supabase/client.ts');
   const {data:games}=await s.from('creator_games').select('*').eq('title',testTitle);
   const verify=(token,key)=>window.hostVerify({url:s.supabaseUrl+'/functions/v1/verify-game-launch',apikey:s.supabaseKey,key,body:{gameId:games[0].id,token}});
   const g=games[0]; if(!g) throw Error('Test game missing');
   const checks=[];
   try {
    const user=(await s.auth.getUser()).data.user;
    if(g.creator_id!==user.id) throw Error('Owner not persisted'); checks.push('Authenticated listing owner persisted');
    const denied=await s.rpc('launch_creator_game',{_game_id:g.id}); if(!denied.error) throw Error('Raw paid URL leaked'); checks.push('Raw paid launch denied');
    const approve=await s.rpc('review_creator_game',{_game_id:g.id,_approve:true}); if(!approve.error) throw Error('Unverified delivery approved'); checks.push('Unverified paid approval denied');
    const live=await s.rpc('request_creator_game_launch',{_game_id:g.id,_environment:'live'}); if(!live.error) throw Error('Live preview allowed'); checks.push('Live launch denied');
    const token=(await s.rpc('request_creator_game_launch',{_game_id:g.id,_environment:'sandbox'})).data;
    if(!token?.token||token.expires_in!==60) throw Error('Preview missing');
    const wrong=await verify(token.token,'a'.repeat(64)); if(!wrong.error) throw Error('Wrong host key allowed'); checks.push('Wrong host key denied');
    const redemption=await verify(token.token,hostKey); if(redemption.error||redemption.data?.preview!==true||redemption.data?.user_id!==user.id) throw Error('Preview redemption failed: '+JSON.stringify({message:redemption.error?.message,response:redemption.data})) ; checks.push('Host redeemed signed-in preview');
    const replay=await verify(token.token,hostKey); if(!replay.error) throw Error('Token reused'); checks.push('Replay denied');
    const reviewed=await s.rpc('review_creator_game_delivery',{_game_id:g.id}); if(reviewed.error) throw Error('Admin delivery review failed');
    const ready=await s.rpc('review_creator_game',{_game_id:g.id,_approve:true}); if(ready.error) throw Error('Admin listing approval failed'); checks.push('Admin approved only after delivery verification');
    const pendingToken=(await s.rpc('request_creator_game_launch',{_game_id:g.id,_environment:'sandbox'})).data;
    await s.from('creator_games').update({status:'pending'}).eq('id',g.id);
    const changed=await s.from('creator_game_builds').update({launch_url:'https://example.org/changed'}).eq('game_id',g.id); if(changed.error) throw Error('Destination update failed');
    const status=await s.rpc('get_creator_game_delivery',{_game_id:g.id}); if(status.data?.[0]?.reviewed_at!==null||status.data?.[0]?.verified_at!==null) throw Error('Review not invalidated');
    const stale=await verify(pendingToken.token,hostKey); if(!stale.error) throw Error('Changed host accepted stale token'); checks.push('Destination edit invalidates review and tokens');
    return checks;
   } finally { const deleted=await s.from('creator_games').delete().eq('id',g.id); if(deleted.error) throw Error('Test cleanup failed'); }
  }''',{'hostKey':hostkey,'testTitle':test_title})
  print('\n'.join(result))
  await page.get_by_role('dialog').get_by_role('button',name='Close',exact=True).click()
  await page.reload()
  await page.get_by_role('tab',name='My games',exact=True).click()
  await page.get_by_text('No games submitted yet',exact=True).wait_for()
  await page.screenshot(path='/tmp/browser/game-delivery/clean-store.png')
  print('Test listing removed; signed-in Games page verified:',page.url)
  await browser.close()
asyncio.run(main())
