import clsx from 'clsx';
import { MouseEventHandler, ReactNode } from 'react';

// Toolbar button styled like the in-game speech bubbles: small, white, rounded.
export default function Button(props: {
  className?: string;
  href?: string;
  imgUrl: string;
  onClick?: MouseEventHandler;
  title?: string;
  children: ReactNode;
}) {
  return (
    <a
      className={clsx(
        'pointer-events-auto inline-flex cursor-pointer select-none items-center gap-2 rounded-lg',
        'border border-[#3a3a3a]/40 bg-white/90 px-3 py-1.5 [font-family:system-ui,sans-serif] text-sm text-[#1f1f1f]',
        'shadow-sm hover:bg-white active:translate-y-px',
        props.className,
      )}
      href={props.href}
      title={props.title}
      onClick={props.onClick}
    >
      {/* The bundled icons are white; invert them to match the dark text. */}
      <img className="h-4 w-4 invert opacity-80" src={props.imgUrl} />
      {props.children}
    </a>
  );
}
