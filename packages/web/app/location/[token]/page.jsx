'use client'

import {useState, useEffect} from 'react'
import {useParams} from 'next/navigation'
import {API_URL} from '@/lib/api'
import { Card } from '@/components/ui/Card';

const POLL_INTERVAL = 35_000

/* this is the viewer side page , where no authentication is required */
export default function PublicLocationPage(){

    const {token} = useParams()
    const [location , setLocation] = useState(null)
    const [status,setStatus] = useState('Loading')   /* location showing status can be loading , active , ended */

    const poll = async()=>[

        
    ]
}