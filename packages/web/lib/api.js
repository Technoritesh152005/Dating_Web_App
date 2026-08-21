export const API_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const api_url = API_URL

const REQUEST_TIMEOUT = 30000

let csrfToken = null
let csrfTokenPromise = null

async function fetchCsrfToken() {
    if (csrfToken) {
        return csrfToken
    }

    if (!csrfTokenPromise) {
        csrfTokenPromise = fetch(`${api_url}/csrf-token`, {
            method: 'GET',
            credentials: 'include'
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch CSRF token')
                }

                const data = await response.json()

                csrfToken = data.csrfToken

                if (!csrfToken) {
                    throw new Error('CSRF token was not returned by server')
                }

                return csrfToken
            })
            .finally(() => {
                csrfTokenPromise = null
            })
    }

    return csrfTokenPromise
}

async function request(path, option = {}) {
    const controller = new AbortController()

    const timeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT
    )

    try {
        const method = (option.method || 'GET').toUpperCase()

        const headers = {
            'Content-Type': 'application/json',
            ...option.headers
        }

        /*
         * CSRF is required only for state-changing requests.
         */
        if (
            ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
        ) {
            const token = await fetchCsrfToken()

            headers['csrf-token'] = token
        }

        let response = await fetch(`${api_url}${path}`, {
            ...option,
            credentials: 'include',
            signal: controller.signal,
            headers
        })

        let contentType =
            response.headers.get('content-type') || ''

        let body = contentType.includes('application/json')
            ? await response.json()
            : null

        /*
         * If the CSRF token became invalid,
         * get a fresh token and retry once.
         */
        if (
            response.status === 403 &&
            body?.code === 'FST_CSRF_INVALID_TOKEN' &&
            ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
        ) {
            csrfToken = null

            const newToken = await fetchCsrfToken()

            headers['csrf-token'] = newToken

            response = await fetch(`${api_url}${path}`, {
                ...option,
                credentials: 'include',
                signal: controller.signal,
                headers
            })

            contentType =
                response.headers.get('content-type') || ''

            body = contentType.includes('application/json')
                ? await response.json()
                : null
        }

        if (!response.ok) {
            const error = new Error(
                body?.message ||
                body?.error ||
                `Request failed: ${response.status}`
            )

            error.status = response.status
            error.body = body

            throw error
        }

        return body

    } catch (err) {

        if (err.name === 'AbortError') {
            const timeoutError = new Error(
                'Request timeout. Please check your connection.'
            )

            timeoutError.status = 408

            throw timeoutError
        }

        throw err

    } finally {
        clearTimeout(timeoutId)
    }
}

export const api = {
    get: (path) =>
        request(path, {
            method: 'GET'
        }),

    post: (path, data) =>
        request(path, {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    put: (path, data) =>
        request(path, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),

    del: (path) =>
        request(path, {
            method: 'DELETE'
        })
}