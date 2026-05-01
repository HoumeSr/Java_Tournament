window.api = {
    request(url, options = {}) {
        return new Promise((resolve, reject) => {
            const defaultHeaders = {};
            const isFormData = options.data instanceof FormData;

            if (!isFormData) {
                defaultHeaders['Content-Type'] = 'application/json';
            }

            const csrf = this.getCsrfToken();
            if (csrf && options.method && options.method !== 'GET') {
                defaultHeaders[csrf.header] = csrf.token;
            }

            const ajaxOptions = {
                url: url,
                type: options.method || 'GET',
                data: options.data,
                headers: {
                    ...defaultHeaders,
                    ...(options.headers || {})
                },
                xhrFields: {
                    withCredentials: true
                },
                success: function(response) {
                    resolve(response);
                },
                error: function(xhr, status, error) {
                    if (xhr.status === 401) {
                        window.location.href = '/login';
                        reject(new Error('Unauthorized'));
                        return;
                    }

                    let message = 'Ошибка запроса';
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        message = xhr.responseJSON.message;
                    } else if (xhr.responseText) {
                        try {
                            const parsed = JSON.parse(xhr.responseText);
                            if (parsed.message) message = parsed.message;
                        } catch (e) {
                            message = xhr.responseText;
                        }
                    } else {
                        message = `Ошибка запроса: ${xhr.status}`;
                    }
                    
                    reject(new Error(message));
                }
            };

            // Для FormData не устанавливаем contentType и не преобразуем данные
            if (isFormData) {
                ajaxOptions.processData = false;
                ajaxOptions.contentType = false;
                ajaxOptions.data = options.data;
            } else if (options.data && typeof options.data === 'object' && options.method !== 'GET') {
                ajaxOptions.data = JSON.stringify(options.data);
            } else if (options.method === 'GET' && options.data) {
                ajaxOptions.data = options.data;
            }

            $.ajax(ajaxOptions);
        });
    },

    get(url, data) {
        return this.request(url, { method: 'GET', data: data });
    },

    post(url, data) {
        return this.request(url, {
            method: 'POST',
            data: data
        });
    },

    put(url, data) {
        return this.request(url, {
            method: 'PUT',
            data: data
        });
    },

    delete(url, data) {
        return this.request(url, {
            method: 'DELETE',
            data: data
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