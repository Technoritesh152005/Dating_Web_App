const GEMINI_EMBED_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent';
const embeddingDimension = 768

export async function generateEmbedding(text){

    const apiKey = process.env.GEMINI_API_KEY
    if(!apiKey)throw new Error('GEMINI_API_KEY is not provided which cause no embedding for profile')

    const normalizedText = typeof text === 'string' ? text.trim() : ''
    if(!normalizedText){
        throw new Error('Embedding input is empty')
    }

    const response = await fetch (`${GEMINI_EMBED_URL}?key=${apiKey}` , {
        method:'POST',
        headers:{ 'Content-Type' : 'application/json'},
        body: JSON.stringify({
            model: 'gemini-embedding-2',
            content: { parts: [{ text: `task: sentence similarity | query: ${normalizedText}` }] },
            config: {
                outputDimensionality: embeddingDimension,
            },
        }),
    })
    if(!response.ok){
        const errorBody = await response.text().catch(()=> '')
        throw new Error(`Gemini embedding request failed: ${response.status}${errorBody}`)
    }
    const data = await response.json()
    const embedding = data?.embedding?.values

    if(!Array.isArray(embedding) || embedding.length !== embeddingDimension)throw new Error('Unexpected error occured while embedding')
    return {embedding:embedding , dimensions:embeddingDimension}
}