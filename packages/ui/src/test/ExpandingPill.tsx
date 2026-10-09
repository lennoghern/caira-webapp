"use client";

import { useId, useState } from "react";
import { GlassReveal } from "../foundations/glass/GlassReveal";
import { GlassSurface } from "../foundations/glass/GlassSurface";
import { Icon } from "../foundations/icon/Icon";

/**
 * Story and fixture helper, not part of the package.
 * One surface that changes size: a compact pill that grows into a panel and
 * back. The same element is on screen the whole time.
 */
export function ExpandingPill({ defaultExpanded = false }: { defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const detailsId = useId();
  return (
    <GlassSurface expanded={expanded} data-testid="pill" className="px-4 py-2">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={() => setExpanded((value) => !value)}
        className="focus-ring flex items-center gap-2 rounded-control text-body font-semibold"
      >
        <Icon name={expanded ? "chevron-up" : "chevron-down"} />
        Now playing
      </button>
      <GlassReveal id={detailsId} expanded={expanded} axis="both" className="w-64 pb-2 pt-2">
        <p className="text-callout text-label-secondary">Track 3 of 12. The surface grew; it was not replaced.</p>
        <a href="#queue" className="focus-ring rounded-control text-callout underline">
          Open the queue
        </a>
      </GlassReveal>
    </GlassSurface>
  );
}
