/**
 * Service Client — Tạo HTTP client gọi giữa các microservices.
 *
 * Sử dụng native fetch (Node 18+).
 * Hỗ trợ retry, timeout, và error handling chuẩn hóa.
 */

/**
 * Tạo service client cho inter-service communication.
 * @param {string} baseUrl — Base URL của target service (vd: 'http://localhost:3002')
 * @param {object} [options]
 * @param {number} [options.timeout=5000] — Request timeout (ms)
 * @param {number} [options.retries=2] — Số lần retry khi fail
 * @returns {object} — Client object với get, post, put, patch, delete methods
 */
export const createServiceClient = (baseUrl, options = {}) => {
    const { timeout = 5000, retries = 2 } = options;

    const normalizedBase = baseUrl.replace(/\/+$/, '');

    /**
     * Gửi request với retry logic.
     */
    const request = async (method, path, body = null, headers = {}) => {
        const url = `${normalizedBase}${path}`;
        let lastError = null;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), timeout);

                const fetchOptions = {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Internal-Service': 'true',
                        ...headers,
                    },
                    signal: controller.signal,
                };

                if (body && method !== 'GET') {
                    fetchOptions.body = JSON.stringify(body);
                }

                const response = await fetch(url, fetchOptions);
                clearTimeout(timer);

                const data = await response.json();

                if (!response.ok) {
                    const error = new Error(
                        data.message || `Service call failed: ${response.status}`
                    );
                    error.status = response.status;
                    error.data = data;
                    throw error;
                }

                return data;
            } catch (error) {
                lastError = error;

                // Không retry nếu là lỗi business logic (4xx)
                if (error.status && error.status >= 400 && error.status < 500) {
                    throw error;
                }

                // Retry cho lỗi network/timeout/5xx
                if (attempt < retries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    console.warn(
                        `[ServiceClient] Retry ${attempt + 1}/${retries} for ${method} ${url}`
                    );
                }
            }
        }

        throw lastError;
    };

    return {
        get: (path, headers) => request('GET', path, null, headers),
        post: (path, body, headers) => request('POST', path, body, headers),
        put: (path, body, headers) => request('PUT', path, body, headers),
        patch: (path, body, headers) => request('PATCH', path, body, headers),
        delete: (path, headers) => request('DELETE', path, null, headers),
    };
};
