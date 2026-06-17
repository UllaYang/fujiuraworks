const GA_MEASUREMENT_ID = 'G-WL4QXRLFQV';

if (GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  const gtagScript = document.createElement('script');
  gtagScript.async = true;
  gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(gtagScript);

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID);
}
