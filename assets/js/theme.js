/* Enfantillage — seasonal theme switch. Loaded in <head> so the theme applies before the page draws.
   Christmas turns on for any host containing "christmas" (e.g. enfantillage-christmas.vercel.app),
   or for previewing with ?theme=christmas (?theme=default turns it off again). */
(function () {
  var KEY = 'enf_theme', theme = '';
  try {
    var q = new URLSearchParams(location.search).get('theme');
    if (q === 'christmas' || q === 'default') sessionStorage.setItem(KEY, q);
    theme = sessionStorage.getItem(KEY) || '';
  } catch (e) { /* private mode */ }
  if (/christmas|xmas|noel/i.test(location.hostname)) theme = theme === 'default' ? '' : 'christmas';
  if (theme === 'christmas') document.documentElement.classList.add('theme-xmas');
  window.ENF_THEME = theme === 'christmas' ? 'christmas' : 'default';
})();
