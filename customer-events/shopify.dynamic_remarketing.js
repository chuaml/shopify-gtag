/* --- basic config start --- */
const ADS_GOOGLE_TAG_ID = 'AW-0000000000';
/* --- basic config end --- */



/* --- advanced config start --- */

const COUNTRY = 'US'; // ISO 3166 country code, required if using default product id of the Shopify's Google & YouTube plugin -> GMC

/* choose 1 and only 1 'GET_PRODUCT_ID', remove the other */
const GET_PRODUCT_ID = v => 'shopify_' + COUNTRY + '_' + v.product.id + '_' + v.id; // default Shopify's Google & YouTube product id
// const GET_PRODUCT_ID = v => v.sku; // SKU as product id 

/* --- advanced config end --- */


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

{ // <!-- Google tag (gtag.js) -->
    gtag('set', { page_location: init.context?.window.location.href });
    gtag('js', new Date());
    gtag('config', ADS_GOOGLE_TAG_ID);
    const script = document.createElement('script');
    script.setAttribute('src', 'https://www.googletagmanager.com/gtag/js?id=' + ADS_GOOGLE_TAG_ID);
    script.setAttribute('async', '');
    document.head.appendChild(script);
    analytics.subscribe('page_viewed', (event) => { // https://shopify.dev/docs/api/web-pixels-api/standard-events/page_viewed
        // may be Single Page App (no full page reload), e.g. in between checkout_started and checkout_completed
        gtag('event', 'page_view', {
            send_to: ADS_GOOGLE_TAG_ID,
            page_location: event.context?.window.location.href
        });
    });
}

// dynamic remarketing purchase event
analytics.subscribe('checkout_completed', (event) => {
    const items = event.data.checkout.lineItems.map(r => {
        const x = {};
        x.id = GET_PRODUCT_ID(r.variant);
        x.google_business_vertical = 'retail';
        return x;
    });
    gtag('event', 'purchase', {
        'send_to': ADS_GOOGLE_TAG_ID,
        'items': items,
        'value': event.data.checkout.subtotalPrice.amount,
        'currency': event.data.checkout.subtotalPrice.currencyCode,
    });
});


// dynamic remarketing view item event
analytics.subscribe('product_viewed', (event) => {
    gtag('event', 'view_item', {
        'send_to': ADS_GOOGLE_TAG_ID,
        'currency': event.data.productVariant.price.currencyCode,
        'value': event.data.productVariant.price.amount,
        'items': [{
            id: GET_PRODUCT_ID(event.data.productVariant),
            google_business_vertical: 'retail'
        }]
    });
});

// dynamic remarketing add to cart event
analytics.subscribe('product_added_to_cart', (event) => {
    gtag('event', 'add_to_cart', {
        'send_to': ADS_GOOGLE_TAG_ID,
        'currency': event.data.cartLine.cost.totalAmount.currencyCode,
        'value': event.data.cartLine.cost.totalAmount.amount,
        'items': [{
            id: GET_PRODUCT_ID(event.data.cartLine.merchandise),
            google_business_vertical: 'retail'
        }]
    });
});

// dynamic remarketing view item list
analytics.subscribe('collection_viewed', (event) => {
    const productVariants = event.data.collection.productVariants;
    const items = productVariants.map(v => {
        const x = {
            id: GET_PRODUCT_ID(v),
            google_business_vertical: 'retail',
            price: v.price.amount,
            currency: v.price.currencyCode,
        };
        return x;
    });

    gtag('event', 'view_item_list', {
        'send_to': ADS_GOOGLE_TAG_ID,
        'items': items,
        'currency': productVariants[0].price.currency,
        'value': productVariants.reduce((total, v) => total + v.price.amount, 0.00),
    });
});

// dynamic remarketing search items
analytics.subscribe('search_submitted', (event) => {
    if (event.data.searchResult.productVariants.length < 1) return; // filter empty result
    const productVariants = event.data.searchResult.productVariants;
    const items = productVariants.map(v => {
        const x = {
            id: GET_PRODUCT_ID(v),
            google_business_vertical: 'retail',
        };
        return x;
    });

    gtag('event', 'view_search_results', {
        'send_to': ADS_GOOGLE_TAG_ID,
        'items': items,
        'currency': productVariants[0].price.currency,
        'value': productVariants.reduce((total, v) => total + v.price.amount, 0.00),
    });
});


// optional begin checkout event
analytics.subscribe('checkout_started', (event) => {
    const items = event.data.checkout.lineItems.map(r => {
        const x = {
            id: GET_PRODUCT_ID(r.variant),
            google_business_vertical: 'retail'
        };
        return x;
    });

    gtag('event', 'begin_checkout', {
        'send_to': ADS_GOOGLE_TAG_ID,
        'items': items,
        'value': event.data.checkout.subtotalPrice.amount,
        'currency': event.data.checkout.subtotalPrice.currencyCode
    });
});