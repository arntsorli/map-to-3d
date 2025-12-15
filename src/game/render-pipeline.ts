import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass";
import {ChromaticVignettePass} from "./passes/chromatic-vignette-pass";

export class RenderPipeline {
  private effectComposer: EffectComposer;
  private renderPass: RenderPass;
  private outlinePass: OutlinePass;
  private renderer: THREE.WebGLRenderer;
  private customPass: ChromaticVignettePass;

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.PerspectiveCamera
  ) {
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.LinearToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = true;

    // Add canvas to dom
    const canvas = this.canvas;
    document.body.appendChild(canvas);

    window.addEventListener("resize", this.onCanvasResize);
    this.onCanvasResize();

    // Setup pipeline
    this.effectComposer = new EffectComposer(this.renderer);
    this.effectComposer.renderToScreen = true;

    // Initial render acts as input for next pass
    this.renderPass = new RenderPass(scene, camera);
    this.effectComposer.addPass(this.renderPass);
    this.customPass = new ChromaticVignettePass();
    this.effectComposer.addPass(this.customPass)

    // Outline pass
    this.outlinePass = new OutlinePass(
      new THREE.Vector2(this.canvas.clientWidth, this.canvas.clientHeight),
      scene,
      camera
    );
    this.outlinePass.edgeStrength = 10;
    this.outlinePass.edgeThickness = 0.25;
    this.outlinePass.edgeGlow = 0;
    this.outlinePass.visibleEdgeColor.set("#ffffff");
    this.effectComposer.addPass(this.outlinePass);

    this.effectComposer.addPass(new OutputPass());

    document.addEventListener('keyup', this.togglePass);
  }

  togglePass = (event: KeyboardEvent) => {
    if (event.key !== 't') return;
    this.customPass.enabled = !this.customPass.enabled;
    console.log('Toggled custom pass:', this.customPass.enabled);
  }

  get canvas() {
    return this.renderer.domElement;
  }

  render(dt: number) {
    this.effectComposer.render(dt);
  }

  outlineObject(object: THREE.Object3D) {
    this.outlinePass.selectedObjects.push(object);
  }

  clearOutlines() {
    this.outlinePass.selectedObjects = [];
  }

  private onCanvasResize = () => {
    this.renderer.setSize(
      this.canvas.clientWidth,
      this.canvas.clientHeight,
      false
    );

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;

    this.camera.updateProjectionMatrix();
  };
}
