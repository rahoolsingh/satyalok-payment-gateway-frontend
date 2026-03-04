import axios from "axios";

const adminApi = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    withCredentials: true, // Always send cookies (satTkn) with every request
    headers: {
        "Content-Type": "application/json",
    },
});

export default adminApi;
