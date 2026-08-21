const api_url =
    process.env.NEXT_PUBLIC_API_URL || 'https://localhost:4000'

const REQUEST_TIMEOUT = 30000

let csrfToken = null

async function fetchCsrfToken() {
    try {
        const response = await fetch(`${api_url}/csrf-token`, {
            method: 'GET',
            credentials: 'include'
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch CSRF token: ${response.status}`)
        }

        const data = await response.json()

        csrfToken = data.csrfToken

        return csrfToken
    } catch (err) {
        console.warn('Failed to fetch CSRF token:', err)
        return null
    }
}

// Get token when browser loads the module
if (typeof window !== 'undefined') {
    fetchCsrfToken()
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

        // Make sure we have a CSRF token before
        // state-changing requests
        if (
            ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
        ) {

            if (!csrfToken) {
                await fetchCsrfToken()
            }

            if (csrfToken) {
                headers['csrf-token'] = csrfToken
            }
        }

        let response = await fetch(`${api_url}${path}`, {
            ...option,
            credentials: 'include',
            signal: controller.signal,
            headers
        })

        let contentType =
            response.headers.get('content-type') || ''

        let body =
            contentType.includes('application/json')
                ? await response.json()
                : null


        /*
         * CSRF token can become invalid/expired.
         * Fetch a new token and retry once.
         */
        if (
            response.status === 403 &&
            (
                body?.code === 'FST_CSRF_INVALID_TOKEN' ||
                body?.code === 'FST_CSRF_MISSING_SECRET'
            ) &&
            ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
        ) {

            await fetchCsrfToken()

            if (csrfToken) {

                headers['csrf-token'] = csrfToken

                response = await fetch(`${api_url}${path}`, {
                    ...option,
                    credentials: 'include',
                    signal: controller.signal,
                    headers
                })

                contentType =
                    response.headers.get('content-type') || ''

                body =
                    contentType.includes('application/json')
                        ? await response.json()
                        : null
            }
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