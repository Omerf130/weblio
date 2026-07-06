import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";
import type { Group } from "three";

type Props = {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  interactive: boolean;
  autoRotate?: boolean;
  isMobile?: boolean;
  simple?: boolean;
};

type ParallaxProps = {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  interactive: boolean;
  autoRotate: boolean;
  children: React.ReactNode;
};

const ParallaxGroup = ({
  mouseX,
  mouseY,
  interactive,
  autoRotate,
  children,
}: ParallaxProps) => {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    if (interactive) {
      const targetY = (mouseX.get() - 0.5) * 0.25;
      const targetX = (mouseY.get() - 0.5) * 0.15;
      group.rotation.y += (targetY - group.rotation.y) * 0.05;
      group.rotation.x += (targetX - group.rotation.x) * 0.05;
      return;
    }

    if (autoRotate) {
      const t = state.clock.getElapsedTime();
      group.rotation.y = Math.sin(t * 0.18) * 0.14;
      group.rotation.x = Math.sin(t * 0.14) * 0.07 + 0.05;
      return;
    }

    group.rotation.x += (0 - group.rotation.x) * 0.06;
    group.rotation.y += (0 - group.rotation.y) * 0.06;
  });

  return <group ref={groupRef}>{children}</group>;
};

const WAVE_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  varying float vElev;
  void main() {
    vec3 p = position;
    float e =
      sin(p.x * 0.35 + uTime * 0.7) * 0.6 +
      sin(p.y * 0.40 + uTime * 0.5) * 0.5 +
      sin((p.x + p.y) * 0.25 - uTime * 0.4) * 0.35;
    p.z += e;
    vElev = e;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const WAVE_FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vElev;
  void main() {
    float m = smoothstep(-1.0, 1.0, vElev);
    vec3 c = mix(uColorA, uColorB, m);
    float a = 0.22 + m * 0.28;
    gl_FragColor = vec4(c, a);
  }
`;

type WaveGridProps = {
  segments: [number, number];
  positionY: number;
};

const WaveGrid = ({ segments, positionY }: WaveGridProps) => {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color("#375477") },
      uColorB: { value: new THREE.Color("#5CE1E6") },
    }),
    [],
  );

  useFrame((state) => {
    uniforms.uTime.value = state.clock.getElapsedTime();
  });

  return (
    <mesh rotation={[-Math.PI / 2.2, 0, 0]} position={[0, positionY, 0]}>
      <planeGeometry args={[26, 18, segments[0], segments[1]]} />
      <shaderMaterial
        wireframe
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={WAVE_VERTEX_SHADER}
        fragmentShader={WAVE_FRAGMENT_SHADER}
      />
    </mesh>
  );
};

const Hero3DScene = ({
  mouseX,
  mouseY,
  interactive,
  autoRotate = false,
  isMobile = false,
  simple = false,
}: Props) => {
  const segments: [number, number] = isMobile
    ? [24, 14]
    : simple
      ? [32, 20]
      : [48, 32];
  const positionY = isMobile ? -2.4 : -1.9;
  const cameraY = isMobile ? 1.1 : 1.4;
  const dpr: [number, number] = isMobile ? [1, 1.25] : [1, 1.5];

  return (
    <Canvas
      className="hero3d__canvas"
      dpr={dpr}
      camera={{ position: [0, cameraY, 6], fov: 45 }}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
      style={{ pointerEvents: "none" }}
    >
      <ParallaxGroup
        mouseX={mouseX}
        mouseY={mouseY}
        interactive={interactive}
        autoRotate={autoRotate}
      >
        <WaveGrid segments={segments} positionY={positionY} />
      </ParallaxGroup>
    </Canvas>
  );
};

export default Hero3DScene;
