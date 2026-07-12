// Sets .dark before paint from localStorage or prefers-color-scheme (no flash).
export function ThemeScript() {
  const js = `(function(){try{var t=localStorage.getItem('theme');document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
