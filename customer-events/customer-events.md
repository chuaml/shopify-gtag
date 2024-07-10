# Customer Event

this directory contain code for 
this directory contain template code for quick and dirty integration of Dynamic Remarketing and Google Analytics 4 via `gtag`,
code to be added in [Shopify's Customer Event](https://help.shopify.com/en/manual/promoting-marketing/pixels/custom-pixels/manage#add-custom-pixel).
* the code example in this directory should be placed in Shopify's Customer Event instead of traditional `theme.liquid` 

> WARNING: code here make no guarantee the success or correctness or anykind of promises.
> the integration rely on Shopify's platform system and software code and Google Analytics to work properly.


# Known issues | Limitations

Below are some of the known issues (but not all) of using the provided code to integrate Google Analytics 4 (GA4) tracking into Shopify via the Shopify Customer Event -> Custom Pixel.

Integrating GA4 via Custom Pixel will result certain GA4 automatic collected events not working normally or correctly
- https://support.google.com/analytics/answer/9234069?hl=en

> Customer Event's Custom Pixel will be placing code into an separated `<iframe>` child window which impose security restrictions,
> resulting in certain events cannot be tracked properly, e.g. `click`, `scroll`, `form_start`, parent page focus and etc. 


## [Enhanced Event Measurements](https://support.google.com/analytics/answer/9216061?hl=en)

certain Enhanced Event Measurements will not work properly in Custom Pixel, e.g.:
- `scroll` will always falsely trigger and sent
- `click` outbound clicks on `<a>` cannot be detected and will not trigger 
- etc...
- https://support.google.com/analytics/answer/9216061?hl=en


## Engagement missing

engagement will not be tracked
https://support.google.com/analytics/answer/11109416?hl=en
- `user_engagement` will not trigger
- `engagement_time_msec` will no be recorded nor included in `scroll` or other common event

> the provided Custom Pixel code fix such issue by manually computing `engagement_time_msec` and sending `user_engagement` event, but the result may different than original auto tracked engagement time;
> e.g. higher engaged time `engagement_time_msec` and higher `user_engagement` event count, that is, higher engagement rate with false positive



---

# references

code based on public developer docs:
- [Google's Advanced Consent Mode](https://support.google.com/google-ads/answer/10000067)
- [Google Analytics 4 - Events](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtag#make_a_purchase_or_issue_a_refund)
- [Google Dynamic Remarketing - Events](https://support.google.com/google-ads/answer/7305793)
- [Shopify Customer Event - Standard Events](https://shopify.dev/docs/api/web-pixels-api/standard-events/)



# technical detail for nerds

there are few thing to be aware of about the Shopify's Customer Event:
* code within Customer Event will have global variable `analytics` to be injected automatically on top of code, and Shopify's [custom events](https://shopify.dev/docs/api/web-pixels-api/standard-events/) triggeration may be used by subscribing to it
* code placed in Customer Event will be held within an `<iframe>` separately with different `window.location.href` URL, but with the same domain name, this implies several thing
    * code in Customer Event cannot get its parent window context; you cannot `document.querySelector` elements in its parent when within Customer Event
    * code executed in Customer Event will have different `window.location.href` URL, may result different (unxpected) URL to be recorded in Reports, e.g. in Google Analytics Reports
    * `gtag` code within Customer Event will have independent Google's Advanced Consent Mode signal than its parent window; it will not respect its parent windows gtag consent siginal
        * however, the existance of the whole Customer Event `<iframe>` and related code will still be control by Shopify's [Customer Privacy](https://help.shopify.com/en/manual/privacy-and-security/privacy/customer-privacy-settings/privacy-settings) if Customer Privacy is in used where the user's region is affected
* Shopify's [Customer Privacy](https://help.shopify.com/en/manual/privacy-and-security/privacy/customer-privacy-settings/privacy-settings) and [Shopify's Customer Event](https://help.shopify.com/en/manual/promoting-marketing/pixels/custom-pixels/manage#add-custom-pixel) allow basic control of tracking consent by blocking/removing certain code and Customer Event `<iframe>` dynamically depending on user's consent, but it does not work nicely with [Google's Advanced Consent Mode](https://support.google.com/google-ads/answer/10000067); basically in the Google perspective, Shopify's Customer Privacy work like as a *Basic* Consent Mode of Google, unless configured to not block the code and always insert Customer Events Custom Pixel code without needed anymore permission or consent from users.
* whether a Customer Event `<iframe>` code will be loaded or not is determined by user's consent (via the pop up consent banner or cookie banner of Customer Privacy) and the  Customer Event -> *Permissions* 
* the Customer Event `<iframe>` will behave like a Single Page App in the begin checkout page, process page, final checkout completed `/thank-you` page; that is, the `<iframe>` will be persisted across pages and not being disposed nor reloaded even when its parent page is reloaded or page is changed. this will result:
    - the `dataLayer` to be persisted and its data to be inherit from begin checkout page to the final complete page
    - certain event may behave unexpectedly, e.g. the Google Analytics event `page_view` is not sent in the final complete checkout page
