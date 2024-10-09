/* --- basic config start --- */
const GTM_ID = 'GTMxxxxxxx';
/* --- basic config end --- */


/* !! base code, no need edit anything below !! */
/* implementation detail */

window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }

{ // Google Consent Mode v2
    gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        wait_for_update: 100
    });

    // Shopify dynamically set consent based on user's previous consent choice or current region default 
    const getConsentChoice = (customerPrivacy) => {
        const consent = {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
        };
        if (customerPrivacy.saleOfDataAllowed === true) {
            if (customerPrivacy.analyticsProcessingAllowed === true) {
                consent.analytics_storage = 'granted';
            }
            if (customerPrivacy.marketingAllowed === true) {
                consent.ad_storage = 'granted';
                consent.ad_user_data = 'granted';
                consent.ad_personalization = 'granted';
            }
        }
        return consent;
    };
    gtag('consent', 'update', getConsentChoice(init.customerPrivacy));

    api.customerPrivacy.subscribe('visitorConsentCollected', (event) => {
        gtag('consent', 'update', getConsentChoice(event.customerPrivacy));
    });
}

gtag('set', { page_location: init.context?.window.location.href });
gtag('js', new Date());
analytics.subscribe('all_standard_events', (event) => {
    dataLayer.push({ shopify_event: null });
    dataLayer.push({
        event: 'Shopify.WebPixel.' + event.name,
        shopify_event: event
    });
});

// <!-- Google Tag Manager -->
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer',GTM_ID);
// <!-- End Google Tag Manager -->
{ // <!-- Google Tag Manager (noscript) -->
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', 'https://www.googletagmanager.com/ns.html?id=' + GTM_ID);
    iframe.setAttribute('height', '0');
    iframe.setAttribute('width', '0');
    iframe.setAttribute('style', 'display:none;visibility:hidden');
    const noscript = document.createElement('noscript');
    noscript.appendChild(iframe);
    document.body.appendChild(noscript);
}
