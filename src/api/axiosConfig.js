import axios from "axios";
import { trackRequest } from "./serverStatus";


export const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:8080/api";


/*
 * The production backend (Render free plan) sleeps when idle and needs
 * 1-2+ minutes to wake up. The old 15 second timeout made every page
 * fail with "Unable to load ..." during that time.
 */
const REQUEST_TIMEOUT_MS = 180000;

// Page loads (GET) are retried once after a dropped connection.
const RETRY_DELAY_MS = 3000;


const api = axios.create({
    baseURL: API_BASE_URL,

    headers: {
        "Content-Type": "application/json"
    },

    timeout: REQUEST_TIMEOUT_MS
});


/*
|--------------------------------------------------------------------------
| Request Interceptor
|--------------------------------------------------------------------------
| Automatically attach JWT token to every API request.
*/

api.interceptors.request.use(
    (config) => {

        const token =
            localStorage.getItem("token");

        if (token) {

            config.headers =
                config.headers || {};

            config.headers.Authorization =
                `Bearer ${token}`;
        }

        // Shows the "waking up the server" indicator if this is slow.
        config.finishTracking = trackRequest();

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);


/*
|--------------------------------------------------------------------------
| Response Interceptor
|--------------------------------------------------------------------------
| Centralized handling of API errors.
*/

api.interceptors.response.use(

    (response) => {
        response.config.finishTracking?.();

        return response;
    },

    async (error) => {

        error.config?.finishTracking?.();

        /*
        |--------------------------------------------------------------------------
        | No server response
        |--------------------------------------------------------------------------
        */

        if (!error.response) {

            const config = error.config;

            const timedOut =
                error.code === "ECONNABORTED";

            // Retry a page load once; never repeat saves/deletes automatically.
            if (
                config &&
                !timedOut &&
                !config.retried &&
                (config.method || "get").toLowerCase() === "get"
            ) {
                config.retried = true;

                await new Promise((resolve) =>
                    setTimeout(resolve, RETRY_DELAY_MS)
                );

                return api(config);
            }

            error.userMessage = timedOut
                ? "The server is taking too long to respond. Please try again in a minute."
                : "Unable to connect to the server. Please check your internet connection and try again.";

            return Promise.reject(error);
        }


        /*
        |--------------------------------------------------------------------------
        | 401 Unauthorized
        |--------------------------------------------------------------------------
        */

        if (error.response.status === 401) {

            const requestUrl =
                error.config?.url || "";


            const isAuthRequest =
                requestUrl.includes("/auth/login") ||
                requestUrl.includes("/login") ||
                requestUrl.includes("/register") ||
                requestUrl.includes("/auth/register");


            if (!isAuthRequest) {

                localStorage.removeItem("token");
                localStorage.removeItem("username");
                localStorage.removeItem("user");


                error.userMessage =
                    "Your session has expired. Please login again.";


                window.dispatchEvent(
                    new CustomEvent(
                        "workoutTracker:sessionExpired"
                    )
                );
            }

        }


        /*
        |--------------------------------------------------------------------------
        | 403 Forbidden
        |--------------------------------------------------------------------------
        */

        else if (error.response.status === 403) {

            error.userMessage =
                "You do not have permission to perform this action.";

        }


        /*
        |--------------------------------------------------------------------------
        | 404 Not Found
        |--------------------------------------------------------------------------
        */

        else if (error.response.status === 404) {

            error.userMessage =
                "The requested resource was not found.";

        }


        /*
        |--------------------------------------------------------------------------
        | 400 Bad Request
        |--------------------------------------------------------------------------
        */

        else if (error.response.status === 400) {

            const backendMessage =
                error.response.data?.message ||
                error.response.data?.error;


            error.userMessage =
                backendMessage ||
                "The request could not be processed.";

        }


        /*
        |--------------------------------------------------------------------------
        | 409 Conflict
        |--------------------------------------------------------------------------
        */

        else if (error.response.status === 409) {

            const backendMessage =
                error.response.data?.message ||
                error.response.data?.error;


            error.userMessage =
                backendMessage ||
                "This operation conflicts with existing data.";

        }


        /*
        |--------------------------------------------------------------------------
        | 500+ Server Error
        |--------------------------------------------------------------------------
        */

        else if (
            error.response.status >= 500
        ) {

            error.userMessage =
                "A server error occurred. Please try again later.";

        }


        /*
        |--------------------------------------------------------------------------
        | Other errors
        |--------------------------------------------------------------------------
        */

        else {

            const backendMessage =
                error.response.data?.message ||
                error.response.data?.error;


            error.userMessage =
                backendMessage ||
                "Something went wrong. Please try again.";
        }


        return Promise.reject(error);
    }
);


export default api;