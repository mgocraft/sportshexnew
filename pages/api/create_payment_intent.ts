
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { supabase } from '../../lib/supabaseClient';

const stripe=new Stripe(process.env.STRIPE_SECRET_KEY||'',{apiVersion:'2023-10-16'});
const NOTE_MAX_LENGTH=500;

const clampMetadataValue=(value:string)=>Array.from(value).slice(0,NOTE_MAX_LENGTH).join('');

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if(req.method!=='POST') return res.status(405).end();
  const {teamId,witchId,type,note}=req.body as {teamId:number;witchId:number;type:'bless'|'curse';note?:string};
  const teamIdNum=Number(teamId); const witchIdNum=Number(witchId);
  if(!Number.isInteger(teamIdNum)||teamIdNum<=0||!Number.isInteger(witchIdNum)||witchIdNum<=0) return res.status(400).json({error:'Invalid team or witch'});
  if(type!=='bless'&&type!=='curse') return res.status(400).json({error:'Invalid spell type'});
  const sanitizedNote=typeof note==='string'?clampMetadataValue(note):'';
  try{
    const {data:w,error}=await supabase.from('witches').select('name,price_cents').eq('id',witchIdNum).single();
    if(error||!w||typeof w.price_cents!=='number'||w.price_cents<=0) return res.status(400).json({error:'Invalid witch'});
    const metadata:Stripe.MetadataParam={teamId:String(teamIdNum),witchId:String(witchIdNum),type};
    if(sanitizedNote) metadata.note=sanitizedNote;
    const pi=await stripe.paymentIntents.create({
      amount:w.price_cents,currency:'usd',description:`${type.toUpperCase()} by ${w.name}`,
      metadata,
      automatic_payment_methods:{enabled:true},
    });
    res.json({clientSecret:pi.client_secret});
  }catch(err){
    console.error('Failed to create payment intent',err);
    const message=err instanceof Error?err.message:'Failed to create payment intent';
    res.status(500).json({error:message});
  }
}
