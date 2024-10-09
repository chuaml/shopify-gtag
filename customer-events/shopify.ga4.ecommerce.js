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
    gtag('config', GA4_MEASUREMENT_ID, { send_page_view: false });
    const script = document.createElement('script');
    script.setAttribute('src', 'https://www.googletagmanager.com/gtag/js?id=' + GA4_MEASUREMENT_ID);
    script.setAttribute('async', '');
    document.head.appendChild(script);
    analytics.subscribe('page_viewed', (event) => { // https://shopify.dev/docs/api/web-pixels-api/standard-events/page_viewed
        // may be Single Page App (no full page reload), e.g. in between checkout_started and checkout_completed
        gtag('event', 'page_view', {
            send_to: GA4_MEASUREMENT_ID,
            page_location: event.context?.window.location.href
        });
    });

    { // patches for engagement time
        const setupManualEngagement = _ => {
            let lastFocusTime = Date.now();
            let engagedTime = 0;
            document.addEventListener('visibilitychange', e => {
                if (document.visibilityState === 'visible')
                    lastFocusTime = Date.now();
                else
                    engagedTime += Date.now() - lastFocusTime;
            });
            window.addEventListener('beforeunload', e => {
                if (document.cookie.includes('_ga_'))
                    gtag('event', 'user_engagement', { engagement_time_msec: Math.min(Date.now() - lastFocusTime + engagedTime, 600000) });
            });
        };
        const setupManualEngagementLater = _ => {
            let pid = 0;
            const handler = _ => {
                clearTimeout(pid);
                pid = setTimeout(_ => {
                    if (document.visibilityState !== 'visible') return;
                    setupManualEngagement();
                    document.removeEventListener('visibilitychange', handler);
                }, 1000);
            };
            document.addEventListener('visibilitychange', handler);
        };
        if (document.visibilityState === 'visible') {
            setTimeout(_ => {
                if (document.visibilityState === 'visible') {
                    setupManualEngagement();
                } else {
                    setupManualEngagementLater();
                }
            }, 1000);
        }
        else {
            setupManualEngagementLater();
        }
    }

    { // patches for common events
        analytics.subscribe('form_submitted', (event) => {
            const element = event.data.element;
            let isValid = false;

            const email = element.elements.find(x => x.tagName === 'INPUT' && x.type === 'email' && x.value !== null)?.value.trim().toLowerCase();
            if (email !== undefined && email.length > 6 && email.includes('@')) {
                gtag('set', 'user_data', { email: email });
                isValid = true;
            }

            const phone = element.elements.find(x => x.tagName === 'INPUT' && x.type === 'tel' && x.value !== null)?.value.replace(/[^0-9]+/g, '');
            if (phone !== undefined && phone.length < 16 && /^[0-9]+$/.test(phone)) {
                gtag('set', 'user_data', { phone_number: '+' + phone });
                isValid = true;
            }

            // at least something valid is filled in
            if (isValid || element.elements.find(x => x.tagName === 'INPUT' && x.type === 'text' && x.value !== null && x.value !== '') !== undefined) {
                gtag('event', 'form_submit', {
                    'send_to': GA4_MEASUREMENT_ID,
                    form_id: element.id,
                    form_destination: element.action,
                    engagement_time_msec: 1000
                });
            }
        });

        analytics.subscribe('clicked', (event) => {
            const element = event.data.element;
            if (element.tagName !== 'A' || element.href === null || element.href === '') return;
            gtag('event', 'click', {
                'send_to': GA4_MEASUREMENT_ID,
                link_id: element.id,
                link_url: element.href,
                engagement_time_msec: 1000
            });
        });
    }
}


{ // from begin_checkout to purchase
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
        if (!event.data.checkout.order || !event.data.checkout.order.id) {
            gtag('event', 'exception', {
                'send_to': GA4_MEASUREMENT_ID,
                'description': 'purchase has no order id, payment incomplete?',
                'fatal': false
            });
            console.warn('purchase has no order id, payment incomplete?');
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
            'transaction_id': checkout.order?.id || new Date().toISOString() + ' ' + Math.random(),
            page_location: event.context?.window.location.href
        });
    });

    let beginCheckoutTime;
    // ga4 begin checkout event
    analytics.subscribe('checkout_started', (event) => {
        beginCheckoutTime = Date.now();
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

        const engagedTime = Date.now() - beginCheckoutTime;
        if (engagedTime >= 1000)
            gtag('event', 'user_engagement', { engagement_time_msec: Math.min(engagedTime, 600000) });
    });
}


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


// search product title
analytics.subscribe('search_submitted', (event) => {
    // if (event.data.searchResult.productVariants.length < 1) return; // filter out empty result
    gtag('event', 'search', {
        'send_to': GA4_MEASUREMENT_ID,
        search_term: event.data.searchResult.query.trim()
    });
});

// auto capture enter email during begin checkout
if (init.context?.window.location.pathname.startsWith('/checkouts/') === true) {
    analytics.subscribe('input_changed', (event) => {
        const element = event.data.element;
        if (element.tagName !== 'INPUT') return;
        if (element.type !== 'text' && element.type !== 'email') return;
        if (element.id !== null && element.id.includes('email') === false) return;

        const email = element.value?.trim();
        if (email === undefined || email === '') return;

        if (email.length > 6 && email.includes('@'))
            gtag('set', 'user_data', { email: email.toLowerCase() });
    });
}