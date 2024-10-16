/* --- basic config start --- */
const ADS_GOOGLE_TAG_ID = 'AW-0000000000';
/* --- basic config end --- */

/* Note:
 choose desired actions `analytics.subscribe(`, keep or remove necessary code as Conversion and then 
 change all 'AW-8888888888/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' Conversion Id and Label below
*/


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
    gtag('config', ADS_GOOGLE_TAG_ID, { 'allow_enhanced_conversions': true });
    const script = document.createElement('script');
    script.setAttribute('src', 'https://www.googletagmanager.com/gtag/js?id=' + ADS_GOOGLE_TAG_ID); // change the conversion ID
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

// purchase
analytics.subscribe('checkout_completed', (event) => {
    const checkout = event.data.checkout;
    _setUPD(checkout);
    gtag('event', 'conversion', {
        'send_to': 'AW-8888888888/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // **change xxx to Conversion Label**
        // 'value': checkout.subtotalPrice.amount, // only product total price
        'value': checkout.totalPrice.amount, // include shipping fee and tax
        'currency': checkout.currencyCode,
        'transaction_id': checkout.order.id,
    });

});

// view_item
analytics.subscribe('product_viewed', (event) => {
    const priceInfo = event.data.productVariant.price;
    gtag('event', 'conversion', {
        'send_to': 'AW-8888888888/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        'value': priceInfo.amount,
        'currency': priceInfo.currencyCode
    });
});

// add_to_cart
analytics.subscribe('product_added_to_cart', (event) => {
    const priceInfo = event.data.cartLine.cost.totalAmount;
    gtag('event', 'conversion', {
        'send_to': 'AW-8888888888/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // **change xxx to Conversion Label**
        'value': priceInfo.amount,
        'currency': priceInfo.currencyCode
    });
});

// begin_checkout
analytics.subscribe('checkout_started', (event) => {
    const priceInfo = event.data.checkout.totalPrice;
    gtag('event', 'conversion', {
        'send_to': 'AW-8888888888/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // **change xxx to Conversion Label**
        'value': priceInfo.amount,
        'currency': priceInfo.currencyCode
    });
});


// search product title
analytics.subscribe('search_submitted', (event) => {
    // if (event.data.searchResult.productVariants.length < 1) return; // filter empty result
    gtag('event', 'conversion', {
        'send_to': 'AW-8888888888/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // **change xxx to Conversion Label**
    });
});

// form submission
analytics.subscribe('form_submitted', (event) => {
    const form = event.data.element;
    if (form.id === 'ContectFormxxxxxxxxxxxxxxxxxxxxxxx') {
        const inputs = form.elements.filter(x => (x.tagName === 'INPUT' || x.tagName === 'TEXTAREA') && x.value !== null);

        let email = inputs.find(x => x.type === 'email').value.trim().toLowerCase();
        let phone = inputs.find(x => x.type === 'tel').value.trim();
        let name = inputs.find(x => x.id === 'ContactForm-name').value.trim();
        if (email.includes('@') && 'yyyyyyyyyyyyyyyyyyyyyyyyyyyyyy') {
            gtag('set', 'user_data', { email: email });
            gtag('event', 'conversion', {
                'send_to': 'AW-8888888888/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // **change xxx to Conversion Label**
            });
        }
    }
});


// link clicks
analytics.subscribe('clicked', (event) => {
    const a = event.data.element;
    if (a.tagName !== 'A' || a.href === null || a.href === '') return;

    if (a.href === 'yyyyyyyyyyyyyyyyyyyyyyyyyyyyyy') { // link click
        gtag('event', 'conversion', {
            'send_to': 'AW-8888888888/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // **change xxx to Conversion Label**
        });
    }
    else if (a.href.startsWith('mailto:')) { // email click
        gtag('event', 'conversion', {
            'send_to': 'AW-8888888888/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // **change xxx to Conversion Label**
        });
    }
    else if (a.href.startsWith('tel:')) { // phone click
        gtag('event', 'conversion', {
            'send_to': 'AW-8888888888/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // **change xxx to Conversion Label**
        });
    }
});





/* optional and not recommended event */
// add_checkout_info
analytics.subscribe('checkout_contact_info_submitted', (event) => { // on enter contact email or phone
    _setUPD(event.data.checkout);
    const priceInfo = event.data.checkout.totalPrice;
    gtag('event', 'conversion', {
        'send_to': 'AW-8888888888/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // **change xxx to Conversion Label**
        'value': priceInfo.amount,
        'currency': priceInfo.currencyCode
    });
});

// add_shipping_info
analytics.subscribe('checkout_shipping_info_submitted', (event) => {
    _setUPD(event.data.checkout);
    const priceInfo = event.data.checkout.totalPrice;
    gtag('event', 'conversion', {
        'send_to': 'AW-8888888888/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // **change xxx to Conversion Label**
        'value': priceInfo.amount,
        'currency': priceInfo.currencyCode
    });
});

// add_payment_info
analytics.subscribe('payment_info_submitted', (event) => {
    _setUPD(event.data.checkout);
    const priceInfo = event.data.checkout.totalPrice;
    gtag('event', 'conversion', {
        'send_to': 'AW-8888888888/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // **change xxx to Conversion Label**
        'value': priceInfo.amount,
        'currency': priceInfo.currencyCode
    });
});
