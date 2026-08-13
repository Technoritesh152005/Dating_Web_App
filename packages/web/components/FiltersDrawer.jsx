'use client'

import {useState, useEffect} from 'react'
import {api} from '../lib/api'
import {Button} from '../components/user_interface/Button'
import {ChoicePills} from '../components/user_interface/choicePills'
import {Input} from './user_interface/Input'

const GENDER_OPTIONS=[
    { value: 'MALE', label: 'Men' },
    { value: 'FEMALE', label: 'Women' },
    { value: 'NON_BINARY', label: 'Non-binary' },
    { value: 'OTHER', label: 'Other' },
]

const DEFAULT_FILTERS = {minAge: 21, maxAge:35 , maxDistance:50, genderPreference:[]}


export function FiltersDrawer({open ,onClose , onSaved}){

    const [filters, setFilters]= useState(DEFAULT_FILTERS)
    const [saving,setSaving] = useState(false)

    useEffect(()=>{
        if(!open) return 
        api.get('/prefernces').then((data)=>{
            if(!data.usingDefaults){
            setFilters({
                minAge:data.minAge,
                maxAge: data.maxAge,
                maxDistanceKm:data.maxDistanceKm,
                genderPreference: data.genderPreference
            })
        }
        })
        /* if any one click the filter this open becomes true and this runs effect */
    },[open])

    if(!open) return null

    /* This happens when user clicks save apply filter */
    const save = async()=>{
        setSaving(true)

        try{
            await api.put('/preferences', filters);
            /* if parent provided what to do after saving call that function */
            onSaved?.()
            onClose()
        }finally{
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 backdrop-blur-sm sm:items-center" onClick={onClose}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-card bg-dusk p-8 sm:rounded-card"
          >
            <h2 className="font-display text-2xl text-cream">Filters</h2>
    
            <div className="mt-6 flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Min age"
                  type="number"
                  min={18}
                  value={filters.minAge}
                  onChange={(e) => setFilters((f) => ({ ...f, minAge: Number(e.target.value) }))}
                />
                <Input
                  label="Max age"
                  type="number"
                  min={18}
                  value={filters.maxAge}
                  onChange={(e) => setFilters((f) => ({ ...f, maxAge: Number(e.target.value) }))}
                />
              </div>
    
              <Input
                label={`Distance — up to ${filters.maxDistanceKm} km`}
                type="range"
                min={5}
                max={200}
                value={filters.maxDistanceKm}
                onChange={(e) => setFilters((f) => ({ ...f, maxDistanceKm: Number(e.target.value) }))}
                className="accent-marigold"
              />
    
              <div>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-cream-dim">Show me</p>
                <ChoicePills
                  options={GENDER_OPTIONS}
                  value={filters.genderPreference}
                  onChange={(v) => setFilters((f) => ({ ...f, genderPreference: v }))}
                  multiple
                />
              </div>
            </div>
    
            <div className="mt-8 flex gap-3">
              <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
              <Button variant="primary" onClick={save} disabled={saving} className="flex-1">
                {saving ? 'Saving…' : 'Apply'}
              </Button>
            </div>
          </div>
        </div>
      );
}