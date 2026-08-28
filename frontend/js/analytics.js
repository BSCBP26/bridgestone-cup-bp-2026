/* Google Analytics 4 — loaded by public page modules. */
(function loadGoogleAnalytics(){
  const measurementId = 'G-3PMTSGFSP8';
  if (!measurementId || document.querySelector('script[data-ga4]')) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(){ window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { anonymize_ip: true });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.dataset.ga4 = 'true';
  document.head.appendChild(script);
})();
