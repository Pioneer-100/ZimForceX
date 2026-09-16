const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mjrefkqskisyxdigexpr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qcmVma3Fza2lzeXhkaWdleHByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1Mjg4NDMsImV4cCI6MjA4NzEwNDg0M30.IfI8dWFCNL6AY3aoHpnKkJwMlA1R7Sa924i5wYXB7HI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getOrCreateBotSession() {
  const email = 'jobs.aggregator.zim@gmail.com';
  const password = 'ZimForceXScraperBot2026!';

  // Try sign in
  let { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    console.log('Bot account not found, signing up new aggregator bot...');
    const signupRes = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: 'ZimForceX Job Aggregator',
          role: 'employer',
          bio: 'Verified automated scraper fetching live career opportunities from VacancyMail, LinkedIn, UN Jobs, and iHarare Jobs for Zimbabwe.'
        }
      }
    });

    if (signupRes.error) {
      console.error('Bot Signup Error:', signupRes.error.message);
      return null;
    }
    data = signupRes.data;
  }

  console.log('Bot session authenticated successfully! User ID:', data.user?.id);

  if (data.user) {
    const { error: profErr } = await supabase.from('profiles').update({
      role: 'employer',
      full_name: 'ZimForceX Job Aggregator',
      bio: 'Verified automated scraper fetching live career opportunities from VacancyMail, LinkedIn, UN Jobs, and iHarare Jobs for Zimbabwe.'
    }).eq('id', data.user.id);

    if (profErr) console.error('Profile update error:', profErr.message);
    else console.log('Profile role set to employer!');
  }

  return { supabase, user: data.user };
}

getOrCreateBotSession();
