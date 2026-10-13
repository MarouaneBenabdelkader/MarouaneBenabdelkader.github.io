// Runs before paint: a stored choice wins, otherwise follow the system. Unknown stored values are ignored.
// Also marks <html class="js"> so motion-only styles (scroll reveal) apply only when scripts run.
export const themeScript = `(function(){document.documentElement.classList.add("js");try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t=null;document.documentElement.dataset.theme=t||(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(e){document.documentElement.dataset.theme="light"}})()`;
