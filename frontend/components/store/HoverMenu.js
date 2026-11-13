'use client';
import { useState } from 'react';

/**
 * A hover / keyboard-focus menu whose panel is only added to the page the first time someone
 * points at it or tabs into it. Showing and hiding is still done by the `group-hover` /
 * `group-focus-within` classes on the panel, so it looks and behaves exactly as before, but the
 * page starts with far fewer elements (the big desktop menus are never needed on phones).
 */
export default function HoverMenu({ as: Tag = 'div', className, panel, children }) {
  const [open, setOpen] = useState(false);
  const wake = open ? undefined : () => setOpen(true);
  return (
    <Tag className={className} onPointerEnter={wake} onFocus={wake} onTouchStart={wake}>
      {children}
      {open ? panel : null}
    </Tag>
  );
}
