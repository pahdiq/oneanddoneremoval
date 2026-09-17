// Content is rendered to HTML at build time, including all navigation and review links.
export function googleReviews(config, esc) {
  const button = (url, label, secondary = false) => url
    ? `<a class="button${secondary ? ' secondary' : ''}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}<span class="sr-only"> (opens in a new tab)</span></a>`
    : `<button class="button${secondary ? ' secondary' : ''}" type="button" disabled aria-describedby="google-links-status">${label}</button>`;
  return `<div class="review-actions">${button(config.googleReviewUrl, 'Leave a Google review')}${button(config.googleBusinessUrl, 'Read reviews on Google', true)}</div>${!config.googleReviewUrl || !config.googleBusinessUrl ? '<p class="small-note" id="google-links-status">Google review links are being added. These buttons will be available once our business profile is connected.</p>' : ''}`;
}

export function reviewsBody(config, esc) {
  return `<section class="section"><div class="wrap reviews-layout"><div><h2>Read a review. Leave a review.</h2><p>Choosing someone to help clear your home is easier when you can hear from their customers. Read about other experiences on Google, or share your own after a job.</p>${googleReviews(config, esc)}<p class="review-invitation">Every customer is welcome to leave an honest review.</p></div><aside><h3>Have a question about your job?</h3><p>You can also contact us directly to discuss a pickup or share feedback with the team.</p><a class="text-link" href="/contact/">Contact 1 & Done Removal</a></aside></div></section>`;
}
