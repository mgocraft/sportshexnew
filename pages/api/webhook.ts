
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { supabase } from '../../lib/supabaseClient';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';

// optional: transactional email via Resend

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
    const {teamId,witchId,type,note}=(pi.metadata||{}) as any;
    await supabase.from('orders').insert({
      team_id:Number(teamId),
      witch_id:Number(witchId),
      type,
      note: note || null,
      factor: 1.0,
      paid_at:new Date().toISOString(),
      status:'paid'
    });

    let teamName:any=teamId; let witchName:any=witchId;
    try{
      const teamRes:PostgrestSingleResponse<any>=await supabase.from('teams').select('name').eq('id',Number(teamId)).single();
      const witchRes:PostgrestSingleResponse<any>=await supabase.from('witches').select('name').eq('id',Number(witchId)).single();
      teamName=teamRes.data?.name||teamName; witchName=witchRes.data?.name||witchName;
    }catch(err){console.error('Lookup failed',err)}

    try{
      await fetch('https://api.resend.com/emails',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.RESEND_API_KEY}`},
        body:JSON.stringify({
          from:process.env.RESEND_FROM||'no-reply@example.com',
          to:process.env.RESEND_TO||'admin@example.com',
          subject:`New ${type} for ${teamName}`,
          text:`${witchName} cast a ${type} on ${teamName}.`
        })
      });
    }catch(err){console.error('Email send failed',err)}
  }
  res.json({received:true});
}
