/* Nextjs basically dont allow to download random images from external website so we notice him or make him aware about what domains u must pich the image*/
/** @type {import('next').NextConfig} */
const nextConfig = {
    images:{
        remotePatterns:[

            /* Currently it is lossened but later will fix this */
            {protocol:'https', hostname:'**'}
        ]
    }
}