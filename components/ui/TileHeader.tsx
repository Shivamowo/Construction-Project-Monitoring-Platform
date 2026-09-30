import type { ReactNode } from 'react';

/** Title row used by every tile and panel: h3 on the left, actions on the right. */
export function TileHeader({ title, children, as: Tag = 'h2', id }: { title: ReactNode; children?: ReactNode; as?: 'h2' | 'h3'; id?: string }) {
  return (
    <div className="tile-head">
      <Tag className="h3" id={id}>{title}</Tag>
      {children && <div>{children}</div>}
    </div>
  );
}
