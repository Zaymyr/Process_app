import React, { useEffect, useRef } from 'react';

type Props = {
  mermaidSrc: string;
  setErrors: (errs: string[]) => void;
};

export function MermaidDiagram({ mermaidSrc, setErrors }: Props) {
  const mmRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!mermaidSrc || !mmRef.current) return;
    const render = async () => {
      const mermaid = await import("mermaid/dist/mermaid.esm.mjs").catch(() => import("mermaid"));
      const api = (mermaid as any).default ?? mermaid;
      api.initialize({ startOnLoad: false, securityLevel: "loose", htmlLabels: true });
      const id = "mermaid-diagram";
      mmRef.current!.innerHTML = `<div id="${id}"></div>`;
      api.render(id + "-svg", mermaidSrc).then(({ svg }: { svg: string }) => {
        const target = document.getElementById(id);
        if (target) target.innerHTML = svg;
      }).catch((e: any) => setErrors([`Mermaid error: ${e?.message ?? String(e)}`]));
    };
    render();
  }, [mermaidSrc]);
  return (
    <section className="card">
      <div ref={mmRef} style={{ minHeight: 140 }}>
        {!mermaidSrc && <em>The diagram will render here…</em>}
      </div>
    </section>
  );
}