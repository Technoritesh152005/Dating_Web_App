const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function generateIceBreaker({ userABio, userBBio, userAInterest, userBInterest }) {

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) throw new Error('GROQ_API_KEY is not set- it is required for iceBreak suggestion')
    const prompt = buildPrompt({ userABio, userAInterest, userBBio, userBInterest })

    const response = await fetch(GROQ_CHAT_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content:
                        'You write ONE short, friendly conversation-starter question for two people who just matched on a dating app. Reference something specific they appear to have in common, based only on what is provided. Output ONLY the question itself - no preamble, no quotes, no explanation. Keep it under 25 words.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.8,
            max_tokens: 60,
        })
    })

    if(!response.ok){
        const errorBody = await response.text().catch(()=> '')
        throw new Error(`Groq request failed :${response.status} ${errorBody}`)
    }
    const data = await response.json()
    const suggestion = data?.choices?.[0]?.message?.content?.trim()

    if(!suggestion)throw new Error('Groq returned no icebreaker suggestion')
    return {suggestion}

}
function buildPrompt({ userABio, userAInterest, userBBio, userBInterest }) {
    
    return [
    `
    Person A - Bio: ${userABio || 'No Bio Provided'}
    Person B - Bio:${userBBio || 'No Bio provided'}
    Person A - Interests: ${(userAInterest ?? []).join(', ') || '(none listed)'},
    Person B - Interests: ${(userBInterest ?? []).join(', ') || '(none listed)'},
    `
    ].join('\n');

}