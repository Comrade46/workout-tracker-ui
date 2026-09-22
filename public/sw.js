const CACHE_NAME =
    "workout-tracker-v1";


const APP_SHELL = [
    "/",
    "/manifest.webmanifest"
];


self.addEventListener(
    "install",
    (event) => {

        event.waitUntil(

            caches
                .open(CACHE_NAME)
                .then((cache) => {

                    return cache.addAll(
                        APP_SHELL
                    );

                })

        );

        self.skipWaiting();
    }
);


self.addEventListener(
    "activate",
    (event) => {

        event.waitUntil(

            caches
                .keys()
                .then((cacheNames) => {

                    return Promise.all(

                        cacheNames
                            .filter(
                                (cacheName) =>
                                    cacheName !==
                                    CACHE_NAME
                            )
                            .map(
                                (cacheName) =>
                                    caches.delete(
                                        cacheName
                                    )
                            )

                    );

                })

        );

        self.clients.claim();
    }
);


self.addEventListener(
    "fetch",
    (event) => {

        /*
         * API requests should always go
         * to the backend.
         */

        if (
            event.request.url.includes(
                "/api/"
            )
        ) {

            return;
        }


        /*
         * Application files:
         * network first, cache fallback.
         */

        event.respondWith(

            fetch(event.request)
                .then((response) => {

                    if (
                        response &&
                        response.status === 200
                    ) {

                        const responseClone =
                            response.clone();

                        caches
                            .open(CACHE_NAME)
                            .then((cache) => {

                                cache.put(
                                    event.request,
                                    responseClone
                                );

                            });

                    }

                    return response;
                })

                .catch(() => {

                    return caches.match(
                        event.request
                    );

                })

        );
    }
);