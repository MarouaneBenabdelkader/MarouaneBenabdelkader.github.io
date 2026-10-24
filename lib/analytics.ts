// Cloudflare Web Analytics: visitor and page counts, with no cookies, so no consent banner.
// The token is public by design (it only identifies the site). Leave it empty to turn tracking off.
const CLOUDFLARE_TOKEN = "a1d754462a874f5f86d96c79d41673d7";

// Only the live site counts, so local testing never adds to the numbers. With `spa` set, the
// beacon also counts pages reached without a reload.
export const analyticsScript = CLOUDFLARE_TOKEN
  ? `(function(){if(location.hostname!=="marouanebenabdelkader.github.io")return;var s=document.createElement("script");s.defer=true;s.src="https://static.cloudflareinsights.com/beacon.min.js";s.setAttribute("data-cf-beacon",${JSON.stringify(JSON.stringify({ token: CLOUDFLARE_TOKEN, spa: true }))});document.head.appendChild(s)})()`
  : "";
