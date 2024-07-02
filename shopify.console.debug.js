// https://shopify.dev/api/ajax

// get current page info
await fetch(location.pathname + '.js')
    .then(response => response.json());
