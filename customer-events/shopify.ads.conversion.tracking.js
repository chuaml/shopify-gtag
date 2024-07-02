/* --- basic config start --- */
const ADS_GOOGLE_TAG_ID = 'AW-0000000000';
/* --- basic config end --- */

/* Note:
 choose desired actions `analytics.subscribe(`, keep or remove necessary code as Conversion and then 
 change all 'AW-8888888888/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' Conversion Id and Label below
*/


window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
/* all code here will not exist nor being loaded, so assume default allow tracking when code is loaded */
gtag('consent', 'default', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted'
});

// <!-- Google tag (gtag.js) -->
const script = document.createElement('script');
script.setAttribute('src', 'https://www.googletagmanager.com/gtag/js?id=' + ADS_GOOGLE_TAG_ID); // change the conversion ID
script.setAttribute('async', '');
document.head.appendChild(script);
gtag('js', new Date());
analytics.subscribe('page_viewed', (event) => { // https://shopify.dev/docs/api/web-pixels-api/standard-events/page_viewed
    // may be Single Page App (no full page reload), e.g. in between checkout_started and checkout_completed
    gtag('set', { page_location: event.context?.window.location.href });
    gtag('config', ADS_GOOGLE_TAG_ID, { 'allow_enhanced_conversions': true });
});

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
    // purchase /thank-you page has no page reload, persists dataLayer from checkout_started page
    gtag('event', 'page_view', {
        'send_to': ADS_GOOGLE_TAG_ID,
        page_location: event.context?.window.location.href
    });

    const checkout = event.data.checkout;
    _setUPD(event.data.checkout);
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
