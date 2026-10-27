import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UpgradeProModal } from '@/components/video-fx/UpgradeProModal';
import { SkinTiersModal } from '@/components/video-fx/SkinTiersModal';
import { PaymentTestModeBanner } from '@/components/PaymentTestModeBanner';
import { Loader2, Zap, Shirt, Mic, Gamepad2, ArrowLeft } from 'lucide-react';
export default function Purchases(){
 const {user,loading:authLoading}=useAuth();const premium=usePremium();
 if(authLoading || premium.loading)return <main className="py-20 flex justify-center"><Loader2 className="animate-spin"/></main>;
 if(!user)return <main className="max-w-5xl mx-auto p-8"><h1 className="text-3xl mb-6">Sign in to view purchases</h1><Button asChild><Link to="/auth">Sign in</Link></Button></main>;
 return <><PaymentTestModeBanner/><main className="max-w-5xl mx-auto px-5 py-8 pb-24 space-y-6"><Button variant="ghost" asChild><Link to="/"><ArrowLeft className="mr-2 h-4 w-4"/>Back to app</Link></Button><h1 className="text-3xl">Purchases & membership</h1>{premium.isFounder && <section className="border-y border-border py-5"><Badge>Founding 100</Badge><h2 className="text-xl mt-3">Your founder benefits are active</h2><p className="text-muted-foreground mt-2">PRO FX and all current skin packs are included at no charge.</p></section>}<div className="grid sm:grid-cols-2 gap-4">{[
 {title:'Video effects & editing',icon:Zap,status:premium.isPremium?'PRO FX active':'Free effects',action:premium.isPremium?'Open editor':'Get PRO FX',href:premium.isPremium?'/animation-center':null,onClick:premium.requestUpgrade},
 {title:'Skin packs',icon:Shirt,status:`${premium.skinTier} skins`,action:premium.skinTier==='elite'?'Open AR Studio':'Browse skin packs',href:premium.skinTier==='elite'?'/ar-studio':null,onClick:premium.requestSkinTier},
 {title:'Podcasts',icon:Mic,status:'Creator memberships & premium episodes',action:'Browse podcasts',href:'/podcasts',onClick:undefined},
 {title:'Games',icon:Gamepad2,status:'Approved games · paid purchases restricted to testing',action:'Browse games',href:'/games',onClick:undefined},
 ].map(item=><article key={item.title} className="border border-border rounded-lg bg-card p-5 flex flex-col gap-3"><item.icon className="text-primary h-6 w-6"/><h2 className="text-xl">{item.title}</h2><p className="text-sm text-muted-foreground capitalize flex-1">{item.status}</p>{item.href?<Button asChild variant="outline"><Link to={item.href}>{item.action}</Link></Button>:<Button onClick={item.onClick}>{item.action}</Button>}</article>)}</div>{!premium.isFounder && <Button asChild variant="outline"><Link to="/founding100">Founding 100 application</Link></Button>}<UpgradeProModal open={premium.upgradeOpen} onClose={premium.closeUpgrade}/><SkinTiersModal open={premium.skinStoreOpen} onClose={premium.closeSkinStore}/></main></>;
}