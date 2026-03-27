

## Fix: Make citation tooltip "View source" clickable

**Problem**: Two bugs prevent the in-text citation tooltip link from working:
1. The tooltip container has `pointer-events-none`, blocking all clicks
2. "View source" is rendered as a `<span>`, not an `<a>` link

**Fix in `src/components/CitationText.tsx`**:
- Remove `pointer-events-none` from the tooltip `motion.div`
- Replace the `<span>` "View source" with an `<a>` tag that has `href={hoveredSource.url}`, `target="_blank"`, and `rel="noopener noreferrer"`
- Keep the tooltip visible on hover by adding `onMouseEnter`/`onMouseLeave` handlers to the tooltip itself so it doesn't disappear when the cursor moves to it

