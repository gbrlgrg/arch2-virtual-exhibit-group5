'use client'

import { Card } from '../../components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion'
import { BookOpen } from 'lucide-react'

export function ExhibitNotes() {
  return (
    <Card className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-5 gap-4">
      <div className="flex items-center gap-2">
        <BookOpen className="size-4 text-cyan-400" aria-hidden="true" />
        <h2 className="text-sm font-medium tracking-wide text-slate-200">
          Exhibit Notes
        </h2>
      </div>

      <Accordion defaultValue={['gap']} className="w-full">
        <AccordionItem value="gap" className="border-slate-800/60">
          <AccordionTrigger className="text-sm text-slate-200 hover:text-cyan-300 hover:no-underline">
            The Hardware Speed Gap
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-slate-400">
            A modern CPU can execute billions of instructions per second, but
            main memory (RAM) is comparatively slow to respond. Reaching out to
            RAM can cost ~100&nbsp;ns, while the on-chip L1 cache answers in
            ~2&nbsp;ns. Caches exist to bridge this enormous speed gap so the CPU
            spends less time waiting and more time computing.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="hitmiss" className="border-slate-800/60">
          <AccordionTrigger className="text-sm text-slate-200 hover:text-cyan-300 hover:no-underline">
            Cache Hits vs. Cache Misses
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-slate-400">
            A <span className="text-emerald-300">hit</span> happens when the
            requested data is already sitting in the cache — the CPU gets it
            almost instantly. A <span className="text-amber-300">miss</span>{' '}
            means the data isn&apos;t cached, so the CPU must travel all the way
            down to RAM, pay the latency penalty, and copy the block back into
            the cache for next time.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="locality" className="border-slate-800/60 border-b-0">
          <AccordionTrigger className="text-sm text-slate-200 hover:text-cyan-300 hover:no-underline">
            Principle of Locality (Spatial &amp; Temporal)
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-slate-400">
            Caching works because programs are predictable.{' '}
            <span className="text-cyan-300">Temporal locality</span>: data used
            recently is likely to be used again soon.{' '}
            <span className="text-cyan-300">Spatial locality</span>: data near a
            recently used address is likely to be needed next. Cache lines load
            whole blocks to exploit both patterns.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}
