// TypeScript
// file: 'src/game/passes/chromatic-vignette-pass.ts'
import * as THREE from "three";
import { Pass, FullScreenQuad } from "three/examples/jsm/postprocessing/Pass";

export class ChromaticVignettePass extends Pass {
    material: THREE.ShaderMaterial;
    fsQuad: FullScreenQuad;

    constructor(
        vignetteStrength = 0.35,
        vignetteSmoothness = 0.6,
        aberrationStrength = 0.002
    ) {
        super();

        const shader = {
            uniforms: {
                tDiffuse: { value: null },
                resolution: { value: new THREE.Vector2(1, 1) },
                vignetteStrength: { value: vignetteStrength },
                vignetteSmoothness: { value: vignetteSmoothness },
                aberrationStrength: { value: aberrationStrength }
            },
            vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 resolution;
        uniform float vignetteStrength;
        uniform float vignetteSmoothness;
        uniform float aberrationStrength;
        varying vec2 vUv;

        vec2 centeredUv(vec2 uv) {
          return (uv - 0.5) * vec2(resolution.x / resolution.y, 1.0);
        }

        void main() {
          vec2 cuv = centeredUv(vUv);
          float r = length(cuv);

          vec2 dir = normalize(cuv + 1e-6);
          vec2 offset = dir * aberrationStrength * r;

          vec4 texR = texture2D(tDiffuse, vUv + offset);
          vec4 texG = texture2D(tDiffuse, vUv);
          vec4 texB = texture2D(tDiffuse, vUv - offset);

          vec3 color = vec3(texR.r, texG.g, texB.b);

          float vignette = smoothstep(1.0, vignetteSmoothness, r) * vignetteStrength;
          color *= (1.0 - vignette);

          gl_FragColor = vec4(color, 1.0);
        }
      `
        };

        this.material = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.clone(shader.uniforms),
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader
        });

        this.fsQuad = new FullScreenQuad(this.material);
    }

    setSize(width: number, height: number) {
        this.material.uniforms.resolution.value.set(width, height);
    }

    render(
        renderer: THREE.WebGLRenderer,
        writeBuffer: THREE.WebGLRenderTarget,
        readBuffer: THREE.WebGLRenderTarget
    ) {
        this.material.uniforms.tDiffuse.value = readBuffer.texture;

        if (this.renderToScreen) {
            this.fsQuad.render(renderer);
        } else {
            renderer.setRenderTarget(writeBuffer);
            this.fsQuad.render(renderer);
        }
    }
}
