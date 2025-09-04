import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email } = req.body as { email?: string };
  if (!email) return res.status(400).json({ error: 'Email required' });
  await supabase
    .from('marketing_contacts')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('email', email);
  res.json({ success: true });
}
