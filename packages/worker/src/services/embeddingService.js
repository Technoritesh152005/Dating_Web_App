const GEMINI_EMBED_URL = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';
const embeddingDimension = 768

export async function generateEmbedding(text){

    const apiKey = process.env.GEMINI_API_KEY
    if(!apiKey)throw new Error('GEMINI_API_KEY is not provided which cause no embedding for profile')
    
        const response = await fetch (`${GEMINI_EMBED_URL}?key=${apiKey}` , {
            method:'POST',
            headers:{ 'Content-Type' : 'application/json'},
            body: JSON.stringify({
                model: 'models/text-embedding-004',
                content: { parts: [{ text }] },
                // RETRIEVAL_DOCUMENT is the correct task type for "content that will
                // be searched/matched against later" (our use case - bios get
                // compared to other bios for compatibility ranking), as opposed to
                // RETRIEVAL_QUERY (a one-off search query) or SEMANTIC_SIMILARITY.
                // Gemini tunes the embedding differently per task type.
                taskType: 'RETRIEVAL_DOCUMENT',
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