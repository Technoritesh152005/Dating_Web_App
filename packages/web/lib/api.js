const api_url = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:4000'
// this api url is public to client side code

// Request timeout to prevent hanging requests
const REQUEST_TIMEOUT = 30000 // 30 seconds

// CSRF token cache
let csrfToken = null

// Fetch CSRF token from backend
async function fetchCsrfToken() {
    try {
        const response = await fetch(`${api_url}/csrf-token`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        })
        if (response.ok) {
            const data = await response.json()
            csrfToken = data.csrfToken
        }
    } catch (err) {
        console.warn('Failed to fetch CSRF token:', err)
    }
}

// Initialize CSRF token on module load (client-side only)
if (typeof window !== 'undefined') {
    fetchCsrfToken()
}

// a wrapper function for all call / request which goes from frontside to backend
async function request(path, option = {}) {

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    // Prepare headers with CSRF token for state-changing methods
    const method = option.method || 'GET'
    const headers = {
        'Content-Type': 'application/json',
        ...option.headers
    }

    // Add CSRF token for mutating requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase()) && csrfToken) {
        headers['csrf-token'] = csrfToken
    }

    try {
        /* response is the reply we get from backend server */
        const response = await fetch(`${api_url}${path}`, {
            ...option,
            /* This tell the browser to put the token in credentials. js dont handle rowser handles it */
            credentials: 'include',
            signal: controller.signal,
            headers
        }
        )

        /* we check the response content type */
        const contentType = response.headers.get('content-type') || ''
        const body = contentType.includes('application/json') ? await response.json() : null

        if (!response.ok) {
            // If CSRF token is invalid/expired, fetch a new one and retry once
            if (response.status === 403 && body?.code === 'FST_CSRF_INVALID_TOKEN' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
                await fetchCsrfToken()
                if (csrfToken) {
                    // Retry the request with new token
                    headers['csrf-token'] = csrfToken
                    const retryResponse = await fetch(`${api_url}${path}`, {
                        ...option,
                        credentials: 'include',
                        signal: controller.signal,
                        headers
                    })
                    const retryContentType = retryResponse.headers.get('content-type') || ''
                    const retryBody = retryContentType.includes('application/json') ? await retryResponse.json() : null
                    if (retryResponse.ok) {
                        return retryBody
                    }
                    const retryError = new Error(retryBody?.error || `Request failed: ${retryResponse.status}`)
                    retryError.status = retryResponse.status
                    retryError.body = retryBody
                    throw retryError
                }
            }
            const error = new Error(body?.error || `Request failed: ${response.status}`)
            error.status = response.status
            error.body = body
            throw error
        }
        /* We return the body data as it is .. which has json data */
        return body
    } catch (err) {
        if (err.name === 'AbortError') {
            const timeoutError = new Error('Request timeout. Please check your connection.')
            timeoutError.status = 408
            throw timeoutError
        }
        throw err
    } finally {
        clearTimeout(timeoutId)
    }
}

// further we do api.get(pathname) and we get the result
export const api = {
    get: (path) => request(path, { method: 'GET' }),
    post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
    put: (path, data) => request(path, { method: 'PUT', body: JSON.stringify(data) }),
    del: (path) => request(path, { method: 'DELETE' }),
}