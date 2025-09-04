
import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function CheckoutForm(){
  const stripe=useStripe(); const elements=useElements();
  const [submitting,setSubmitting]=useState(false);
  const [error,setError]=useState<string|undefined>();

  const onSubmit=async(e:any)=>{
    e.preventDefault(); if(!stripe||!elements) return;
    setSubmitting(true);
    const {error}=await stripe.confirmPayment({elements,confirmParams:{return_url:`${window.location.origin}/?success=1`},redirect:'if_required'});
    if(error) setError(error.message);
    setSubmitting(false);
  };

  return(<form onSubmit={onSubmit} className="max-w-md mx-auto card mt-8">
    <PaymentElement/>
    <button disabled={!stripe||submitting} className="btn w-full mt-4">{submitting?'Processing...':'Pay'}</button>
    {error&&<p className="text-red-400 text-sm mt-2">{error}</p>}
  </form>);
}

export default function PayPage(){
  const router=useRouter();
  const {teamId,witchId,type}=router.query as {teamId?:string;witchId?:string;type?:'bless'|'curse'};
  const [note,setNote]=useState('');
  const [email,setEmail]=useState('');
  const [marketingOptIn,setMarketingOptIn]=useState(false);
  const init=useMemo(()=>({teamId:Number(teamId),witchId:Number(witchId),type:(type||'curse') as 'bless'|'curse'}),[teamId,witchId,type]);
  const [clientSecret,setClientSecret]=useState<string|null>(null);
  const [intentError,setIntentError]=useState<string|null>(null);
  const [loadingIntent,setLoadingIntent]=useState(false);

  const startPayment=async()=>{
    if(!init.teamId||!init.witchId) return;
    try{
      setLoadingIntent(true); setIntentError(null);
      const res=await fetch('/api/create_payment_intent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...init,note,email,marketingOptIn})});
      if(!res.ok){
        const message=await res.text();
        throw new Error(message||'Failed to create payment intent');
      }
      const json=await res.json(); setClientSecret(json.clientSecret);
    }catch(err){
      console.error(err);
      setIntentError(err instanceof Error?err.message:'Failed to create payment intent');
    }finally{setLoadingIntent(false);}
  };

  if(!init.teamId||!init.witchId) return <main className="max-w-xl mx-auto p-6">Missing selection. Go back and pick a team and witch.</main>;
  if(!clientSecret) return <main className="max-w-xl mx-auto p-6">
    <h1 className="text-2xl font-bold mb-3">Add your intent</h1>
    <label className="block text-sm mb-2">What exactly are you blessing/curing? (free text)</label>
    <textarea value={note} onChange={e=>setNote(e.target.value)} className="w-full p-2 rounded bg-black/40 border border-gray-700" rows={4} placeholder="e.g., Bless the Bears' O-line vs Packers, Week 1"/>
    <label className="block text-sm mb-2 mt-4">Email</label>
    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-2 rounded bg-black/40 border border-gray-700"/>
    <label className="mt-4 flex items-center gap-2 text-sm">
      <input type="checkbox" checked={marketingOptIn} onChange={e=>setMarketingOptIn(e.target.checked)}/>
      <span>Send me occasional marketing emails. You can unsubscribe anytime.</span>
    </label>
    {intentError && <p className="text-red-400 text-sm mt-3">{intentError}</p>}
    <button onClick={startPayment} disabled={loadingIntent||!email} className="btn w-full mt-4">{loadingIntent?'Preparing...':'Continue to Payment'}</button>
  </main>;

  return(<Elements stripe={stripePromise!} options={{clientSecret}}>
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Complete your {init.type}</h1>
      <label className="block text-sm mb-2 mt-4">What exactly are you blessing/curing? (free text)</label>
      <textarea value={note} onChange={e=>setNote(e.target.value)} className="w-full p-2 rounded bg-black/40 border border-gray-700" rows={4} placeholder="e.g., Bless the Bears' O-line vs Packers, Week 1"/>
      <CheckoutForm/>
    </main>
  </Elements>);
}
