"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ScreenQuad } from "@react-three/drei";
import * as THREE from "three";

// WebGL-зерно + мягкий ЭЛТ-фликер (§7). ЦЕЛЬ ленивого next/dynamic ssr:false —
// three импортируется ТОЛЬКО здесь и грузится лишь для «full»-устройств.
// WCAG 2.3.1: фликер медленный (~0.48 Гц) и малоамплитудный, без >3 вспышек/сек.

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uGrain;
  uniform float uFlicker;
  uniform float uScan;
  uniform vec3 uTint;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    float g = hash(vUv * 800.0 + uTime * 60.0);          // зерно (каждый кадр)
    float scan = sin(vUv.y * 1400.0) * 0.5 + 0.5;          // скан-линии ЭЛТ
    float flick = sin(uTime * 3.0) * 0.5 + 0.5;            // медленный фликер
    float a = uGrain * g + uScan * scan * 0.15 + uFlicker * flick;
    gl_FragColor = vec4(uTint, clamp(a, 0.0, 1.0));
  }
`;

function GrainPlane() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  useFrame((_, delta) => {
    if (mat.current) mat.current.uniforms.uTime.value += delta;
  });
  return (
    <ScreenQuad>
      <shaderMaterial
        ref={mat}
        args={[
          {
            vertexShader,
            fragmentShader,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            uniforms: {
              uTime: { value: 0 },
              uGrain: { value: 0.16 }, // «заметнее» — зерно
              uFlicker: { value: 0.04 }, // мягкий фликер яркости
              uScan: { value: 0.6 }, // скан-линии
              uTint: { value: new THREE.Color(0.62, 0.66, 0.72) }, // холодный «монитор»
            },
          },
        ]}
      />
    </ScreenQuad>
  );
}

export default function GrainCanvas() {
  return (
    <Canvas
      aria-hidden
      gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
      dpr={[1, 1.5]}
      frameloop="always"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 30,
        pointerEvents: "none",
        mixBlendMode: "overlay",
      }}
    >
      <GrainPlane />
    </Canvas>
  );
}
