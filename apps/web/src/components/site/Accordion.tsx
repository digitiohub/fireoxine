'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AccordionItem = { id: string; question: string; answer: string };

/**
 * The FAQ, numbered the way the reference site numbers it. Native <details>
 * would be simpler, but the reference opens one at a time and animates the
 * height, so this is a controlled set.
 */
export function Accordion({ items, className }: { items: AccordionItem[]; className?: string }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className={cn('border-t border-rule', className)}>
      {items.map((item, index) => {
        const open = openId === item.id;
        return (
          <div key={item.id} className="border-b border-rule">
            <h3>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : item.id)}
                aria-expanded={open}
                aria-controls={`faq-panel-${item.id}`}
                className="flex w-full items-start gap-4 py-5 text-left transition-colors hover:text-wedge sm:gap-6"
              >
                <span className="fx-num fx-stencil mt-1 shrink-0 text-xs text-ink-faint">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 text-base font-medium leading-snug sm:text-lg">
                  {item.question}
                </span>
                <Plus
                  className={cn(
                    'mt-0.5 size-5 shrink-0 text-ink-muted transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                    open && 'rotate-45'
                  )}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <div
              id={`faq-panel-${item.id}`}
              className={cn(
                'grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              )}
            >
              <div className="overflow-hidden">
                <p className="max-w-[72ch] pb-6 pl-[2.6rem] pr-8 text-sm leading-relaxed text-ink-muted sm:pl-[3.4rem]">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
