
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { supabase } from '../../lib/supabaseClient';

export const config={api:{bodyParser:false}};
const stripe=new Stripe(process.env.STRIPE_SECRET_KEY||'',{apiVersion:'2023-10-16'});

async function buffer(readable:any){const chunks=[];for await(const chunk of readable){chunks.push(typeof chunk==='string'?Buffer.from(chunk):chunk)}return Buffer.concat(chunks)}

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if(req.method!=='POST') return res.status(405).end();
  const sig=req.headers['stripe-signature']; const buf=await buffer(req); let event:Stripe.Event;
  try{event=stripe.webhooks.constructEvent(buf,sig as string,process.env.STRIPE_WEBHOOK_SECRET||'');}
  catch(err:any){return res.status(400).send(`Webhook Error: ${err.message}`)}
  if(event.type==='payment_intent.succeeded'){
    const pi=event.data.object as Stripe.PaymentIntent;
    const {teamId,witchId,type,note,email,marketing_opt_in}=(pi.metadata||{}) as any;
    await supabase.from('orders').insert({
      team_id:Number(teamId),
      witch_id:Number(witchId),
      type,
      note: note || null,
      factor: 1.0,
      paid_at:new Date().toISOString(),
      status:'paid'
    });

    if(marketing_opt_in==='true' && email){
      const {data:existing}=await supabase.from('marketing_contacts').select('unsubscribed_at').eq('email',email).single();
      if(!existing||!existing.unsubscribed_at){
        await supabase.from('marketing_contacts').upsert({email,source:'checkout'},{onConflict:'email'});
      }
    }
  }
  res.json({received:true});
}
