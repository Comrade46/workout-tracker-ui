import axios from "axios";


const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:8080/api";


const api = axios.create({
    baseURL: API_BASE_URL,

    headers: {
        "Content-Type": "application/json"
    },

    timeout: 15000
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
        return response;
    },

    (error) => {

        /*
        |--------------------------------------------------------------------------
        | No server response
        |--------------------------------------------------------------------------
        */

        if (!error.response) {

            error.userMessage =
                "Unable to connect to the server. Please make sure the backend is running.";

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