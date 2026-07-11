// Sets .dark before paint from localStorage or prefers-color-scheme (no flash).
export function ThemeScript() {
  const js = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme:dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
