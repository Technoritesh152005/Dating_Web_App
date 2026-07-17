function calculateAge(dob){
        const diffMs = Date.now()-dob.getTime()
    const ageDate = new Date(diffMs)
    console.log(ageDate)
    return Math.abs(ageDate.getUTCFullYear-1970)
}
calculateAge(15022005)