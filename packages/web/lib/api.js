const api_url = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:4000'
// this api url is public to client side code

// a wrapper function for all call / request which goes from frontside to backend
async function request(path, option = {}) {

    /* response is the reply we get from backend server */
    const response = await fetch(`${api_url}${path}`, {
        ...option,
        /* This tell the browser to put the token in credentials. js dont handle rowser handles it */
        credentials: 'include',
        headers: {
            /* This tells the backend that we are sending the request in json format */
            'Content-Type': 'application/json',
            ...option.headers
        }
    }
    )
    console.log(response)
    /* we check the response content type */
    const contentType = response.headers.get('content-type') || ''
    const body = contentType.includes('application/json') ? await response.json() : null

    if (!response.ok) {

        const Error = new Error(body?.error || `Request failed : ${response.status}`)
        Error.status = response.status
        Error.body = body
        throw Error
    }
    /* We return the body data as it is .. which has json data */
    return body
}

// further we do api.det(pathname) and we get the result
export const api = {
    get: (path) => request(path, { method: 'GET' }),
    post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
    put: (path, data) => request(path, { method: 'PUT', body: JSON.stringify(data) }),
    del: (path) => request(path, { method: 'DELETE' }),
}
