window.api = {
    async request(url, options = {}) {
        const defaultHeaders = {};
        const isFormData = options.body instanceof FormData;


        if (!isFormData) {
            defaultHeaders['Content-Type'] = 'application/json';
        }


        const csrf = this.getCsrfToken();
        if (csrf && options.method && options.method !== 'GET') {
            defaultHeaders[csrf.header] = csrf.token;
        }


        const response = await fetch(url, {
            credentials: 'same-origin',
            ...options,
            headers: {
                ...defaultHeaders,
                ...(options.headers || {})
            }
        });


        const contentType = response.headers.get('content-type') || '';
        let body = null;


        if (contentType.includes('application/json')) {
            body = await response.json();
        } else {
            body = await response.text();
        }


        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }


        if (!response.ok) {
            const message = body && body.message
                ? body.message
                : `Ошибка запроса: ${response.status}`;
            throw new Error(message);
        }


        return body;
    },


    get(url) {
        return this.request(url, { method: 'GET' });
    },


    post(url, data) {
        return this.request(url, {
            method: 'POST',
            body: data instanceof FormData ? data : JSON.stringify(data || {})
        });
    },


    put(url, data) {
        return this.request(url, {
            method: 'PUT',
            body: data instanceof FormData ? data : JSON.stringify(data || {})
        });
    },


    delete(url, data) {
        return this.request(url, {
            method: 'DELETE',
            body: data ? JSON.stringify(data) : undefined
        });
    },


    getCsrfToken() {
        const tokenMeta = document.querySelector('meta[name="_csrf"]');
        const headerMeta = document.querySelector('meta[name="_csrf_header"]');


        if (!tokenMeta || !headerMeta) {
            return null;
        }


        return {
            header: headerMeta.getAttribute('content'),
            token: tokenMeta.getAttribute('content')
        };
    }
};
