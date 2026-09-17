import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { googleReviews } from './content.mjs';
import { validateConfig } from './config.mjs';
const config=JSON.parse(fs.readFileSync('site.config.json','utf8'));
const routes=['/','/services/','/service-areas/','/reviews/','/contact/','/privacy/'];
const titles=new Set(),descriptions=new Set();let references=0;
for(const route of routes){
  const html=fs.readFileSync(path.join('dist',route,'index.html'),'utf8');
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,`${route}: needs one H1`);
  const title=html.match(/<title>(.*?)<\/title>/s)?.[1];
  assert(title&&!titles.has(title),`${route}: duplicate/missing title`);titles.add(title);
  const description=html.match(/name="description" content="([^"]+)"/)?.[1];
  assert(description&&!descriptions.has(description),`${route}: duplicate/missing description`);descriptions.add(description);
  assert(html.includes(`rel="canonical" href="${config.domain+route}"`),`${route}: canonical`);
  assert(html.includes(`content="${config.indexable?'index,follow,max-image-preview:large':'noindex,follow'}"`),`${route}: index directive`);
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert(schema['@graph'].some(x=>x['@type']==='LocalBusiness'),`${route}: business schema`);
  assert(!html.includes('AggregateRating'),`${route}: self-serving review rating`);
  assert(!/href="(?:tel:|sms:|mailto:)"/.test(html),`${route}: empty contact link`);
  for(const match of html.matchAll(/(?:href|src)="(\/[^"#]*)(#[^"]*)?"/g)){
    const [,url,hash]=match;let target=path.join('dist',url);if(url.endsWith('/'))target=path.join(target,'index.html');
    assert(fs.existsSync(target),`${route}: missing ${url}`);references++;
    if(hash){const destination=fs.readFileSync(target,'utf8');assert(destination.includes(`id="${hash.slice(1)}"`),`${route}: missing anchor ${url+hash}`);}
  }
  for(const match of html.matchAll(/<img\b[^>]*>/g)) assert(/\balt="[^"]*"/.test(match[0])&&/\bwidth="\d+"/.test(match[0])&&/\bheight="\d+"/.test(match[0]),`${route}: image accessibility/dimensions`);
  for(const match of html.matchAll(/href="#([^"]+)"/g)) assert(html.includes(`id="${match[1]}"`),`${route}: missing page anchor ${match[1]}`);
  for(const match of html.matchAll(/srcset="([^"]+)"/g)) for(const candidate of match[1].split(',')) assert(fs.existsSync(path.join('dist',candidate.trim().split(/\s+/)[0])),`${route}: missing responsive image`);
}
const sitemap=fs.readFileSync('dist/sitemap.xml','utf8');
for(const route of routes)assert(sitemap.includes(`<loc>${config.domain+route}</loc>`),`sitemap missing ${route}`);
assert(fs.existsSync('dist/assets/garage-800.webp'));
assert(fs.existsSync('dist/assets/garage-hero.webp'));
assert(fs.statSync('dist/assets/garage-hero.webp').size<350000,'Hero exceeds performance budget');
assert(fs.statSync('dist/assets/wasatch-front.webp').size<300000,'Regional photo exceeds performance budget');
assert(fs.statSync('dist/assets/wasatch-front-800.webp').size<100000,'Mobile regional photo exceeds performance budget');
const areas=fs.readFileSync('dist/service-areas/index.html','utf8');
assert(areas.includes('https://creativecommons.org/licenses/by/4.0/')&&areas.includes('Invictus323'),'Regional photo needs attribution');
assert(!areas.includes('PHOTO_CREDIT_PENDING'),'Unfinished attribution');
assert.equal(fs.readFileSync('dist/CNAME','utf8').trim(),'oneanddoneremoval.com');
const services=fs.readFileSync('dist/services/index.html','utf8');
assert(!services.includes('class="number"')&&!services.includes('class="service-row"'),'Numbered service layout must be removed');
const font=fs.readFileSync('dist/assets/source-sans-3-latin.woff2');
assert.equal(font.subarray(0,4).toString(),'wOF2','Valid compressed web font');
assert(font.length<50000,'Font exceeds 50KB performance budget');
const css=fs.readFileSync('dist/assets/site.css','utf8');
assert(!css.includes('letter-spacing:-.045em'),'Cramped heading spacing must be removed');
for (const route of ['/','/reviews/']) {
  const html=fs.readFileSync(path.join('dist',route,'index.html'),'utf8');
  assert(html.includes('Leave a Google review')&&html.includes('Read reviews on Google'),`${route}: both review controls visible`);
  for(const [key,label] of [['googleReviewUrl','Leave a Google review'],['googleBusinessUrl','Read reviews on Google']]) {
    if(!config[key]) assert(new RegExp(`<button[^>]+disabled[^>]*>${label}</button>`).test(html),`${route}: missing Google URL must not create a fake link`);
  }
}
const configuredReviews=googleReviews({googleReviewUrl:'https://g.page/r/test/review',googleBusinessUrl:'https://maps.google.com/?cid=test'},x=>x);
assert(configuredReviews.includes('href="https://g.page/r/test/review"'),'Configured write-review link');
assert(configuredReviews.includes('href="https://maps.google.com/?cid=test"'),'Configured read-reviews link');
assert(!configuredReviews.includes('disabled'),'Configured Google links must be enabled');
assert.throws(()=>validateConfig({...config,googleReviewUrl:'https://example.com/'}),'Reject unrelated review destinations');
assert.throws(()=>validateConfig({...config,indexable:true,phone:''}),'Block indexing with missing business details');
console.log(`PASS: ${routes.length} pages, ${references} local references, unique metadata, canonical URLs, structured data, sitemap, contact guards, image sizes.`);
console.log('PASS: readable font, unnumbered services, review controls, configured link activation, and launch safeguards.');
if(process.argv.includes('--launch')){
  const missing=[];
  if(!config.phone)missing.push('Business phone number');
  if(!config.indexable)missing.push('indexable: true after final review');
  if(missing.length){console.error('Launch is not ready:\n- '+missing.join('\n- '));process.exitCode=1;}
  else console.log('PASS: launch prerequisites');
}
