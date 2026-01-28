
interface FetchWithRetryOptions {
    maxRetries?: number
    initialDelayMs?: number
    backoffFactor?: number
}

/**
 * Wrapper around fetch that retries on 429 Too Many Requests.
 * Uses exponential backoff.
 */
export async function fetchWithRetry(
    url: string,
    init?: RequestInit,
    options: FetchWithRetryOptions = {}
): Promise<Response> {
    const {
        maxRetries = 3,
        initialDelayMs = 1000,
        backoffFactor = 2
    } = options

    let attempt = 0
    let delay = initialDelayMs

    while (true) {
        try {
            const response = await fetch(url, init)

            if (response.status === 429) {
                attempt++
                if (attempt > maxRetries) {
                    console.warn(`[fetchWithRetry] Max retries (${maxRetries}) exceeded for 429 at ${url}`)
                    return response // Return the 429 response so caller can handle it
                }

                console.warn(`[fetchWithRetry] Hit 429 at ${url}. Retrying in ${delay}ms (Attempt ${attempt}/${maxRetries})...`)
                await new Promise((resolve) => setTimeout(resolve, delay))
                delay *= backoffFactor
                continue
            }

            return response
        } catch (error) {
            // Network errors are also worth retrying? 
            // Usually generic fetch errors are network issues. 
            // For now, let's just focus on 429 as requested.
            // But if fetch completely fails (e.g. timeout), standard fetch throws.
            // We could retry that too, but let's stick to 429 for now to follow the specific requirement.
            throw error
        }
    }
}
