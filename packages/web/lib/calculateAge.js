export function calculateAge(dob){
    const dobMs = new Date(dob)
    const diffInMs = Date.now() - dobMs
    const age = new Date(diffInMs)
    return Math.abs(ageDate.getUTCFullYear() - 1970)
}