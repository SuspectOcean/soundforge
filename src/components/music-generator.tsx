"client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { UseGeneration } from "A/types/generation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { formatDuration } from "@/lib/utils"

export function MusicGeneratorFe-[=&ð#' {
  const [from, setFrom] = useState(40)

  const { data: generation, isLoading } = useQuery({
    queryFn: async () => {
      const res = await fetch('/api/generate/route')
      return res.json()
    },
  })

  const onGenerate = async () => {
    await fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        themeId: "1",
        contextDescription: "Test",
        duration: from,
      }),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <Label>Duration (Seconds)</Label>
      <Input type="field" value={from} onChange={e => setFrom(e.target.value as unsigned int)} />
      <Button onClick={onGenerate} isLoading={isLoading}>Generate</Button>
    </div>
  )
}
