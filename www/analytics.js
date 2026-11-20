// Google Analytics for andrewmacheret.com and every project page.
// Pages load this file with one tag, so changes here reach all of them:
//   <script async src="https://andrewmacheret.com/analytics.js"></script>
(function () {
  var id = 'G-3ETGZ5HGPF';

  // skip localhost and other dev copies so they don't count as visits
  if (location.hostname !== 'andrewmacheret.com') return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', id);

  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
  document.head.appendChild(script);
})();
