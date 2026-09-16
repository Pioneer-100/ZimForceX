import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const maxDuration = 60; // Up to 60 seconds execution time on Vercel
export const dynamic = 'force-dynamic';

function cleanText(str: string): string {
  if (!str) return '';
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSkills(text: string, defaults = ['Communication', 'Problem Solving']): string[] {
  const skills = new Set(defaults);
  const lower = text.toLowerCase();
  if (lower.includes('account') || lower.includes('finance') || lower.includes('cfo')) { skills.add('Accounting'); skills.add('Financial Analysis'); }
  if (lower.includes('sales') || lower.includes('marketing')) { skills.add('Sales'); skills.add('Business Development'); }
  if (lower.includes('driver') || lower.includes('transport')) { skills.add('Logistics'); skills.add('Vehicle Operation'); }
  if (lower.includes('project') || lower.includes('coordinator')) { skills.add('Project Management'); skills.add('Planning'); }
  if (lower.includes('developer') || lower.includes('tech') || lower.includes('software') || lower.includes('it')) { skills.add('Software Engineering'); skills.add('IT Systems'); }
  if (lower.includes('admin') || lower.includes('clerk') || lower.includes('secretary')) { skills.add('Administration'); skills.add('Office Management'); }
  if (lower.includes('nurse') || lower.includes('health') || lower.includes('medical')) { skills.add('Healthcare'); skills.add('Patient Care'); }
  return Array.from(skills);
}

// 1. LINKEDIN ZIMBABWE
async function scrapeLinkedIn() {
  const jobs: any[] = [];
  try {
    const url = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?location=Zimbabwe&start=0';
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const cardRegex = /<div[^>]*class="[^"]*job-search-card[^"]*"[\s\S]*?<\/li>/g;
    const cards = html.match(cardRegex) || [];

    for (const card of cards) {
      const titleMatch = card.match(/<h3[^>]*class="[^"]*base-search-card__title[^"]*"[^>]*>([\s\S]*?)<\/h3>/i);
      const companyMatch = card.match(/<h4[^>]*class="[^"]*base-search-card__subtitle[^"]*"[^>]*>([\s\S]*?)<\/h4>/i);
      const locationMatch = card.match(/<span[^>]*class="[^"]*job-search-card__location[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
      const urlMatch = card.match(/href="(https:\/\/[^"]*linkedin\.com\/jobs\/view\/[^"]*)"/i);

      const title = cleanText(titleMatch ? titleMatch[1] : '');
      const company = cleanText(companyMatch ? companyMatch[1] : 'Verified Employer');
      let location = cleanText(locationMatch ? locationMatch[1] : 'Harare, Zimbabwe');
      if (!location.includes('Zimbabwe')) location = `${location}, Zimbabwe`;
      const external_url = urlMatch ? urlMatch[1].split('?')[0] : '';

      if (title && external_url) {
        jobs.push({
          title,
          company,
          location,
          external_url,
          source_site: 'LinkedIn Zimbabwe',
          job_type: title.toLowerCase().includes('remote') ? 'remote' : title.toLowerCase().includes('contract') ? 'contract' : 'full_time',
          experience_level: title.toLowerCase().includes('senior') || title.toLowerCase().includes('chief') || title.toLowerCase().includes('lead') || title.toLowerCase().includes('manager') ? 'senior' : title.toLowerCase().includes('junior') || title.toLowerCase().includes('intern') ? 'entry' : 'mid',
          skills_required: extractSkills(title),
          description: `Position: ${title}\nCompany: ${company}\nLocation: ${location}\nSource: LinkedIn Zimbabwe\n\nFull listing and direct application available on LinkedIn:\n${external_url}`
        });
      }
    }
  } catch (err: any) {
    console.error('LinkedIn API Error:', err.message);
  }
  return jobs;
}

// 2. VACANCYMAIL ZIMBABWE
async function scrapeVacancyMail() {
  const jobs: any[] = [];
  try {
    const url = 'https://vacancymail.co.zw/jobs/';
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const linkRegex = /<a[^>]+href="(\/jobs\/[^\"]+|\/job\/[^\"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    const seenUrls = new Set();

    while ((match = linkRegex.exec(html)) !== null) {
      const linkPath = match[1];
      const rawTitle = cleanText(match[2]);

      if (linkPath && rawTitle && rawTitle.length > 5 && !seenUrls.has(linkPath) && !rawTitle.toLowerCase().includes('view details') && !rawTitle.toLowerCase().includes('search')) {
        seenUrls.add(linkPath);
        const fullUrl = linkPath.startsWith('http') ? linkPath : `https://vacancymail.co.zw${linkPath}`;

        let location = 'Harare, Zimbabwe';
        if (rawTitle.toLowerCase().includes('bulawayo')) location = 'Bulawayo, Zimbabwe';
        else if (rawTitle.toLowerCase().includes('gweru')) location = 'Gweru, Zimbabwe';
        else if (rawTitle.toLowerCase().includes('mutare')) location = 'Mutare, Zimbabwe';

        jobs.push({
          title: rawTitle,
          company: 'VacancyMail Recruiter',
          location,
          external_url: fullUrl,
          source_site: 'VacancyMail Zimbabwe',
          job_type: rawTitle.toLowerCase().includes('part time') ? 'part_time' : rawTitle.toLowerCase().includes('contract') ? 'contract' : 'full_time',
          experience_level: rawTitle.toLowerCase().includes('manager') || rawTitle.toLowerCase().includes('head') ? 'senior' : rawTitle.toLowerCase().includes('trainee') ? 'entry' : 'mid',
          skills_required: extractSkills(rawTitle),
          description: `Job Title: ${rawTitle}\nLocation: ${location}\nSource: VacancyMail Zimbabwe\n\nApply directly on VacancyMail portal:\n${fullUrl}`
        });
      }
    }
  } catch (err: any) {
    console.error('VacancyMail API Error:', err.message);
  }
  return jobs;
}

// 3. UN JOBS ZIMBABWE
async function scrapeUNJobs() {
  const jobs: any[] = [];
  try {
    const url = 'https://zimbabwe.un.org/en/jobs';
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const linkRegex = /<a[^>]+href="([^"]+)"[^>]*title="([^"]+)"[^>]*>(.*?)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const fullUrl = match[1];
      const titleAttr = cleanText(match[2]);
      const linkText = cleanText(match[3]);
      const title = titleAttr || linkText;

      if (fullUrl && title && title.length > 10) {
        let agency = 'United Nations Zimbabwe';
        if (fullUrl.includes('unicef')) agency = 'UNICEF Zimbabwe';
        else if (fullUrl.includes('undp')) agency = 'UNDP Zimbabwe';
        else if (fullUrl.includes('wfp')) agency = 'WFP Zimbabwe';
        else if (fullUrl.includes('who')) agency = 'WHO Zimbabwe';

        let location = 'Harare, Zimbabwe';
        if (title.toLowerCase().includes('bulawayo')) location = 'Bulawayo, Zimbabwe';

        jobs.push({
          title,
          company: agency,
          location,
          external_url: fullUrl,
          source_site: 'UN Jobs Zimbabwe',
          job_type: title.toLowerCase().includes('consultant') ? 'contract' : 'full_time',
          experience_level: title.toLowerCase().includes('senior') || title.toLowerCase().includes('head') ? 'senior' : 'mid',
          skills_required: extractSkills(title, ['UN Operations', 'Program Management', 'International Development']),
          description: `Official Vacancy: ${title}\nAgency: ${agency}\nLocation: ${location}\nSource: UN Jobs Zimbabwe Portal\n\nApply via official UN Careers portal:\n${fullUrl}`
        });
      }
    }
  } catch (err: any) {
    console.error('UN Jobs API Error:', err.message);
  }
  return jobs;
}

// 4. IHARARE JOBS
async function scrapeiHarareJobs() {
  const jobs: any[] = [];
  try {
    const url = 'https://ihararejobs.com/feed/';
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    const xml = await res.text();
    const itemRegex = /<item>[\s\S]*?<\/item>/g;
    const items = xml.match(itemRegex) || [];

    for (const item of items) {
      const titleMatch = item.match(/<title>(.*?)<\/title>/i);
      const linkMatch = item.match(/<link>(.*?)<\/link>/i);
      const descMatch = item.match(/<description>([\s\S]*?)<\/description>/i);

      let title = cleanText(titleMatch ? titleMatch[1] : '');
      const external_url = linkMatch ? cleanText(linkMatch[1]) : '';
      const rawDesc = cleanText(descMatch ? descMatch[1] : '');

      if (title.includes('<![CDATA[')) {
        title = title.replace('<![CDATA[', '').replace(']]>', '').trim();
      }

      if (title && external_url && !title.toLowerCase().includes('feed main')) {
        let location = 'Harare, Zimbabwe';
        if (title.toLowerCase().includes('bulawayo')) location = 'Bulawayo, Zimbabwe';
        else if (title.toLowerCase().includes('gweru')) location = 'Gweru, Zimbabwe';
        else if (title.toLowerCase().includes('mutare')) location = 'Mutare, Zimbabwe';
        else if (title.toLowerCase().includes('mashonaland')) location = 'Mashonaland, Zimbabwe';
        else if (title.toLowerCase().includes('matabeleland')) location = 'Matabeleland, Zimbabwe';

        jobs.push({
          title,
          company: 'iHarare Verified Recruiter',
          location,
          external_url,
          source_site: 'iHarare Jobs',
          job_type: title.toLowerCase().includes('contract') ? 'contract' : title.toLowerCase().includes('intern') || title.toLowerCase().includes('trainee') ? 'part_time' : 'full_time',
          experience_level: title.toLowerCase().includes('intern') || title.toLowerCase().includes('trainee') ? 'entry' : title.toLowerCase().includes('senior') || title.toLowerCase().includes('corporate') ? 'senior' : 'mid',
          skills_required: extractSkills(title),
          description: `Listing: ${title}\nLocation: ${location}\nSource: iHarare Jobs\n\nSummary:\n${rawDesc}\n\nRead full requirements and apply at iHarare:\n${external_url}`
        });
      }
    }
  } catch (err: any) {
    console.error('iHarare Jobs API Error:', err.message);
  }
  return jobs;
}

export async function GET() {
  try {
    const email = process.env.SCRAPER_BOT_EMAIL || 'employer@test.com';
    const password = process.env.SCRAPER_BOT_PASSWORD || 'password123';
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });

    if (authErr || !authData.user) {
      return NextResponse.json({ error: 'Authentication failed for employer bot' }, { status: 401 });
    }

    const userId = authData.user.id;

    const [li, vm, un, ih] = await Promise.all([
      scrapeLinkedIn(),
      scrapeVacancyMail(),
      scrapeUNJobs(),
      scrapeiHarareJobs()
    ]);

    const allJobs = [...li, ...vm, ...un, ...ih];

    const { data: existingJobs } = await supabase.from('jobs').select('title');
    const existingTitles = new Set((existingJobs || []).map(j => j.title.toLowerCase().trim()));

    let insertedCount = 0;
    let skippedCount = 0;

    for (const job of allJobs) {
      const titleKey = job.title.toLowerCase().trim();
      if (existingTitles.has(titleKey)) {
        skippedCount++;
        continue;
      }

      const payload = {
        posted_by: userId,
        title: job.title,
        description: job.description,
        location: job.location,
        job_type: job.job_type,
        experience_level: job.experience_level,
        skills_required: job.skills_required,
        status: 'active'
      };

      const { error: insertErr } = await supabase.from('jobs').insert(payload);
      if (!insertErr) {
        insertedCount++;
        existingTitles.add(titleKey);
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalScraped: allJobs.length,
        insertedCount,
        skippedCount,
        breakdown: {
          linkedIn: li.length,
          vacancyMail: vm.length,
          unJobs: un.length,
          iHarareJobs: ih.length
        }
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
