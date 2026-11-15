import axios from "axios";

/**
 * Recurring pledge API client.
 *
 * The backend only accepts a plan id (or a custom amount it validates itself),
 * so nothing here can influence the amount that gets debited.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const api = axios.create({
    baseURL: `${BACKEND_URL}/pledge`,
    timeout: 25000,
    headers: { "Content-Type": "application/json" },
});

/** Turn any axios failure into a human readable message. */
export const extractApiError = (error) => {
    if (error?.response?.data?.message) {
        return error.response.data.message;
    }

    if (error?.code === "ECONNABORTED") {
        return "The server took too long to respond. Please try again.";
    }

    if (!error?.response) {
        return "We could not reach the server. Check your connection and try again.";
    }

    return "Something went wrong. Please try again.";
};

export const fetchPlans = async () => {
    const { data } = await api.get("/plans");
    return data;
};

export const createPledge = async ({ payload, idempotencyKey }) => {
    const { data } = await api.post("/", payload, {
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
    });

    return data;
};

export const fetchPledgeStatus = async (pledgeRef) => {
    const { data } = await api.get(`/${encodeURIComponent(pledgeRef)}/status`);
    return data;
};

export const fetchPortal = async (token) => {
    const { data } = await api.get(`/manage/${encodeURIComponent(token)}`);
    return data;
};

const portalAction = async (token, action, body = {}) => {
    const { data } = await api.post(
        `/manage/${encodeURIComponent(token)}/${action}`,
        body,
    );

    return data;
};

export const pausePledge = (token, reason) => portalAction(token, "pause", { reason });
export const resumePledge = (token) => portalAction(token, "resume");
export const skipCycle = (token) => portalAction(token, "skip");
export const cancelPledge = (token, reason) => portalAction(token, "cancel", { reason });

export const requestPortalLink = async (email) => {
    const { data } = await api.post("/recover", { email });
    return data;
};

/** Client side idempotency key so a double submit cannot create two mandates. */
export const newIdempotencyKey = () => {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID().replace(/-/g, "");
    }

    return `k${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
};

export default api;
