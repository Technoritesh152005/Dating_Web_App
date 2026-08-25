// this compress the image in browser and the compressed image is further stored is stored in s3

export async function compressImage(file , {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.85,
    maxSize = 1024*1024*2
} = {}){

    //it must file only no other media
    if(!file.type.startsWith('image/')){
        return file
    }

    //it takes dimension from browser
    const bitmap = await createImageBitmap(file)

    // file less than 1600*1600 dont compress it and degrade the quality
    const isSmall = 
    bitmap.width <= maxWidth 
    &&
    bitmap.height <= maxHeight
    && 
    file.size <= maxSize

    if(isSmall){
        bitmap.close()
        return file
    }

    const scale = Math.min(
        1,
        maxWidth / bitmap.width,
        maxHeight / bitmap.height
    )

    //canvas becomes the new smaller image
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)

    // "Take the original image and draw it onto my smaller canvas."
    const context = canvas.getContext('2d')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    //convert to webp
    const blob = await new Promise((resolve,reject)=>{
        canvas.toBlob(
        (result) => result ? resolve(result) : reject(new Error('Image compression failed')),
        'image/webp',
        quality
    )
    })

    //giving it a new file name
    const baseName = file.name.replace(/\.[^/.]+$/, '')
    return new File(
        [blob],
        `${baseName}.webp`,
        {
            type: 'image/webp',
            lastModified: Date.now(),
        }
    )
}