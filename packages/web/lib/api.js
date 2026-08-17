const api_url = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:4000'
// this api url is public to client side code

// Request timeout to prevent hanging requests
const REQUEST_TIMEOUT = 30000 // 30 seconds

// a wrapper function for all call / request which goes from frontside to backend
async function request(path, option = {}) {

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    try {
        /* response is the reply we get from backend server */
        const response = await fetch(`${api_url}${path}`, {
            ...option,
            /* This tell the browser to put the token in credentials. js dont handle rowser handles it */
            credentials: 'include',
            signal: controller.signal,
            headers: {
                /* This tells the backend that we are sending the request in json format */
                'Content-Type': 'application/json',
                ...option.headers
            }
        }
        )

        /* we check the response content type */
        const contentType = response.headers.get('content-type') || ''
        const body = contentType.includes('application/json') ? await response.json() : null

        if (!response.ok) {
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