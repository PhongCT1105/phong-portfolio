'use client';

import { useEffect, useRef, useState } from 'react';
import { SITE_CONTENT } from '@/lib/content';
import { clamp01, sceneState } from '@/lib/session';

const GPU_NODES = [
  { cls: 'gpu-node--a', name: 'GPU_A', delta: 0 },
  { cls: 'gpu-node--b', name: 'GPU_B', delta: -4 },
  { cls: 'gpu-node--c gpu-node--hub', name: 'SYNC', delta: -10 },
  { cls: 'gpu-node--d', name: 'GPU_C', delta: -15 },
  { cls: 'gpu-node--e', name: 'GPU_D', delta: -7 }
];

export default function FocusSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [scene, setScene] = useState(() => sceneState(0));

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const update = () => {
      const rect = section.getBoundingClientRect();
      const total = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = clamp01(-rect.top / total);
      setScene(sceneState(progress));
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="focus section-pad"
      id="focus"
      aria-labelledby="focus-title"
      data-stage={scene.stage}
    >
      <div className="focus__sticky">
        <div className="section-shell focus__frame">
          <div className="focus__copy reveal">
            <p className="eyebrow">02 / {SITE_CONTENT.focus.eyebrow}</p>
            <h2 id="focus-title">
              Distributed compute is abundant.
              <br />
              <span>Bandwidth isn&rsquo;t.</span>
            </h2>
            <p className="focus__body">{SITE_CONTENT.focus.body}</p>
            <div className="focus__tags">
              {SITE_CONTENT.focus.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>

          <div
            className="focus-viz"
            aria-label="Animated visualization of fragmented GPU utilization and network bottlenecks"
          >
            <div className="focus-viz__label focus-viz__label--left">COMPUTE POOL</div>
            <div className="focus-viz__label focus-viz__label--right">{scene.label}</div>
            <svg className="focus-viz__links" viewBox="0 0 760 420" aria-hidden="true">
              <path className="link link--1" d="M90 90 C190 35, 260 90, 355 140" />
              <path className="link link--2" d="M90 300 C210 345, 250 245, 355 210" />
              <path className="link link--3" d="M355 140 C470 70, 575 70, 675 115" />
              <path className="link link--4" d="M355 210 C480 255, 565 315, 675 300" />
              <path className="link link--5" d="M355 140 C360 175, 360 190, 355 210" />
            </svg>
            {GPU_NODES.map((node) => (
              <div key={node.name} className={`gpu-node ${node.cls}`}>
                <span>{node.name}</span>
                <b>{Math.max(18, scene.utilization + node.delta)}%</b>
              </div>
            ))}
            <div className="packet packet--1" />
            <div className="packet packet--2" />
            <div className="packet packet--3" />
            <div className="bandwidth-meter" aria-hidden="true">
              <span>NETWORK BANDWIDTH</span>
              <i>
                <b style={{ width: `${scene.bandwidth}%` }} />
              </i>
            </div>
          </div>

          <p className="focus__end">{SITE_CONTENT.focus.end}</p>
        </div>
      </div>
    </section>
  );
}
