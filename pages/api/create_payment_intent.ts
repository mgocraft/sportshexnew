
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { supabase } from '../../lib/supabaseClient';

const stripe=new Stripe(process.env.STRIPE_SECRET_KEY||'',{apiVersion:'2023-10-16'});

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if(req.method!=='POST') return res.status(405).end();
  const {teamId,witchId,type,note,email,marketingOptIn}=req.body as {teamId:number;witchId:number;type:'bless'|'curse';note?:string;email:string;marketingOptIn?:boolean};
  const {data:w,error}=await supabase.from('witches').select('name,price_cents').eq('id',witchId).single();
  if(error||!w) return res.status(400).json({error:'Invalid witch'});
  const pi=await stripe.paymentIntents.create({
    amount:w.price_cents,
    currency:'usd',
    description:`${type.toUpperCase()} by ${w.name}`,
    metadata:{teamId:String(teamId),witchId:String(witchId),type,note:note||'',email,marketing_opt_in:marketingOptIn?'true':'false'},
    receipt_email:email,
    automatic_payment_methods:{enabled:true},
  });
  res.json({clientSecret:pi.client_secret});
}
