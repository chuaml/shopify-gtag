/* --- basic config start --- */
const GA4_MEASUREMENT_ID = 'Gxxxxxxxxxx';
/* --- basic config end --- */



/* --- advanced config start --- */

const COUNTRY = 'US'; // ISO 3166 country code, required if using default product id of the Shopify's Google & YouTube plugin -> GMC

/* choose 1 and only 1 'GET_PRODUCT_ID', remove the other */
const GET_PRODUCT_ID = v => v.sku || 'shopify_' + COUNTRY + '_' + v.product.id + '_' + v.id; // mixed both, either SKU or product id
// const GET_PRODUCT_ID = v => 'shopify_' + COUNTRY + '_' + v.product.id + '_' + v.id; // default Shopify's Google & YouTube product id
// const GET_PRODUCT_ID = v => v.sku; // SKU as product id 

/* --- advanced config end --- */


/* !! base code, no need edit anything below !! */
/* implementation detail */

window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }

{ // Consent Mode v2
    gtag('consent', 'default', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        wait_for_update: 100,
        region: [ // EEA only
            'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'CH'
        ],
    });

    const updateConsent = (customerPrivacy) => {
        const analytics_consent = customerPrivacy.analyticsProcessingAllowed ? 'granted' : 'denied';
        const ads_consent = customerPrivacy.marketingAllowed ? 'granted' : 'denied';
        gtag('consent', 'update', {
            analytics_storage: analytics_consent,
            ad_storage: ads_consent,
            ad_user_data: ads_consent,
            ad_personalization: ads_consent,
        });
    };
    updateConsent(init.customerPrivacy);

    api.customerPrivacy.subscribe('visitorConsentCollected', (event) => {
        updateConsent(event.customerPrivacy);
    });
}

{ // <!-- Google tag (gtag.js) -->
    const script = document.createElement('script');
    script.setAttribute('src', 'https://www.googletagmanager.com/gtag/js?id=' + GA4_MEASUREMENT_ID);
    script.setAttribute('async', '');
    document.head.appendChild(script);
    analytics.subscribe('page_viewed', (event) => { // https://shopify.dev/docs/api/web-pixels-api/standard-events/page_viewed
        // may be Single Page App (no full page reload), e.g. in between checkout_started and checkout_completed
        gtag('set', { page_location: event.context?.window.location.href });
        gtag('js', new Date());
        gtag('config', GA4_MEASUREMENT_ID);
    });
}


const _setUPD = (checkout) => {
    // const checkout = event.data.checkout;
    const upd = {};
    upd.email = checkout.email?.trim().toLowerCase();
    upd.phone_number = checkout.phone?.trim() || checkout.billingAddress.phone?.trim();

    const address = checkout.billingAddress;
    upd.address = {
        first_name: address.firstName,
        last_name: address.lastName,
        country: address.countryCode,
        postal_code: address.zip,

        street: address.address1 || undefined,
        city: address.city || undefined,
        region: address.province || undefined,
    };
    gtag('set', 'user_data', upd);
};


// ga4 purchase event
analytics.subscribe('checkout_completed', (event) => {
    // purchase /thank-you page has no page reload, persists dataLayer from checkout_started page
    gtag('event', 'page_view', {
        'send_to': GA4_MEASUREMENT_ID,
        page_location: event.context?.window.location.href
    });

    if (!event.data.checkout.order || !event.data.checkout.order.id) {
        gtag('event', 'exception', {
            'send_to': GA4_MEASUREMENT_ID,
            'description': 'purchase has no order id, payment incomplete',
            'fatal': false
        });
        console.error('purchase has no order id, payment incomplete');
        return;
    }

    const items = event.data.checkout.lineItems.map(r => {
        const x = {
            item_id: GET_PRODUCT_ID(r.variant),
            item_name: r.variant.product.title,
            quantity: r.quantity,
            price: r.variant.price.amount,
            currency: r.variant.price.currencyCode,
            discount: r.discountApplications?.reduce((t, d) => t + d.amount, 0.00),
            item_variant: r.variant.title
        };
        return x;
    });

    const checkout = event.data.checkout;
    _setUPD(checkout);
    gtag('event', 'purchase', {
        'send_to': GA4_MEASUREMENT_ID,
        'items': items,
        'value': checkout.subtotalPrice.amount,
        'currency': checkout.subtotalPrice.currencyCode,
        'shipping': checkout.shippingLine?.price.amount,
        'tax': checkout.totalTax?.amount,
        'transaction_id': checkout.order.id,
        page_location: event.context?.window.location.href
    });
});


// ga4 view item event
analytics.subscribe('product_viewed', (event) => {
    gtag('event', 'view_item', {
        'send_to': GA4_MEASUREMENT_ID,
        'currency': event.data.productVariant.price.currencyCode,
        'value': event.data.productVariant.price.amount,
        'items': [{
            item_id: GET_PRODUCT_ID(event.data.productVariant),
            item_name: event.data.productVariant.product.title,
            quantity: 1,
            price: event.data.productVariant.price.amount,
            currency: event.data.productVariant.price.currencyCode,
            item_variant: event.data.productVariant.title
        }]
    });
});

// ga4 add to cart event
analytics.subscribe('product_added_to_cart', (event) => {
    gtag('event', 'add_to_cart', {
        'send_to': GA4_MEASUREMENT_ID,
        'currency': event.data.cartLine.cost.totalAmount.currencyCode,
        'value': event.data.cartLine.cost.totalAmount.amount,
        'items': [{
            item_id: GET_PRODUCT_ID(event.data.cartLine.merchandise),
            item_name: event.data.cartLine.merchandise.product.title,
            quantity: event.data.cartLine.quantity,
            price: event.data.cartLine.merchandise.price.amount,
            currency: event.data.cartLine.merchandise.price.currencyCode,
            item_variant: event.data.cartLine.merchandise.title
        }]
    });
});


// ga4 begin checkout event
analytics.subscribe('checkout_started', (event) => {
    const items = event.data.checkout.lineItems.map(r => {
        const x = {
            item_id: GET_PRODUCT_ID(r.variant),
            item_name: r.variant.product.title,
            quantity: r.quantity,
            price: r.variant.price.amount,
            currency: r.variant.price.currencyCode,
            item_variant: r.variant.title
        };
        return x;
    });

    gtag('event', 'begin_checkout', {
        'send_to': GA4_MEASUREMENT_ID,
        'items': items,
        'value': event.data.checkout.subtotalPrice.amount,
        'currency': event.data.checkout.subtotalPrice.currencyCode,
        'shipping': event.data.checkout.shippingLine?.price.amount,
        'tax': event.data.checkout.totalTax?.amount
    });
});



// ga4 add payment info
analytics.subscribe('payment_info_submitted', (event) => {
    const items = event.data.checkout.lineItems.map(r => {
        const x = {
            item_id: GET_PRODUCT_ID(r.variant),
            item_name: r.variant.product.title,
            quantity: r.quantity,
            price: r.variant.price.amount,
            currency: r.variant.price.currencyCode,
            item_variant: r.variant.title
        };
        return x;
    });

    const checkout = event.data.checkout;
    _setUPD(checkout);
    gtag('event', 'add_payment_info', {
        'send_to': GA4_MEASUREMENT_ID,
        'items': items,
        'value': checkout.subtotalPrice.amount,
        'currency': checkout.subtotalPrice.currencyCode,
        'shipping': checkout.shippingLine?.price.amount,
        'tax': checkout.totalTax?.amount
    });
});


// search product title
analytics.subscribe('search_submitted', (event) => {
    // if (event.data.searchResult.productVariants.length < 1) return; // filter empty result
    gtag('event', 'search', {
        search_term: event.data.searchResult.query.trim()
    });
});