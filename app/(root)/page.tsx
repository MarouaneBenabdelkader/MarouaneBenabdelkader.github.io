// Static entry point: French browsers go to /fr/, everyone else (and no-JS visitors) to /en/.
const redirect = `try{if((navigator.language||"").toLowerCase().indexOf("fr")===0)location.replace("/fr/")}catch(e){}`;

export default function RootPage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: redirect }} />
      <p>
        <a href="/en/">English</a> / <a href="/fr/">Français</a>
      </p>
    </>
  );
}
