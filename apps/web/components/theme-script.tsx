// Sets .dark before paint from explicit localStorage only (no flash).
// Demo default is white-first; users can still opt into dark mode via the toggle.
export function ThemeScript() {
  const js = `(function(){try{var t=localStorage.getItem('theme');document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
