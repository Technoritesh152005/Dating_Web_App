export function calculateAge(dob) {
    const dobDate = new Date(dob)
    const now = new Date()

    let age = now.getFullYear() - dobDate.getFullYear()
    const monthDiff = now.getMonth() - dobDate.getMonth()

    // Adjust if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dobDate.getDate())) {
        age--
    }

    return age
}