import * as THREE from 'three'

/**
 * A glass bead resting in the centre of the pool, drawn with three.js.
 *
 * The sphere is solved analytically on a fullscreen quad: an orthographic ray
 * refracts at the front surface, crosses the interior and refracts out again -
 * with up to two internal reflections when it strikes the far surface too
 * shallow. Where that ray lands on the water plane, the *live* water canvas is
 * sampled, so the caustics inside the bead travel as the pool moves. The same
 * landing point is sampled three times at tiny offsets, which is the chromatic
 * dispersion real glass shows.
 *
 * The shading layers that make it read as glass rather than as a circle: a
 * Fresnel-weighted sky reflection, a tight flash from the key light over a
 * broad sheen, an internal caustic opposite the key light, grazing light
 * gathering along the silhouette, a whisper of absorption over the path
 * through the glass, and a soft contact shadow pressed into the water.
 *
 * The quad outputs premultiplied alpha and is transparent everywhere outside
 * the bead, so the DOM type above it is never touched.
 */

export type BeadSceneHandle = { dispose: () => void }

const VERT = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const FRAG = /* glsl */ `
precision highp float;

uniform sampler2D uWater;
uniform vec2 uRes;
uniform vec2 uCenter;
uniform float uRadius;
uniform float uTime;
uniform float uDip;   // how far the bead still sits below its resting line, in radius units
uniform float uFade;  // 1 while the bead is under, ->0 as it finishes surfacing

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// What the bead reflects: bright overcast sky above the horizon, and the
// bright pool itself below it — rays aimed down must not return a dark tone,
// or the silhouette gains a painted-on dark outline.
vec3 sky(vec3 dir) {
  float up = clamp(dir.y * 0.5 + 0.75, 0.0, 1.0);
  vec3 s = mix(vec3(0.80, 0.90, 0.98), vec3(1.0), up);
  return mix(vec3(0.94, 0.97, 1.0), s, smoothstep(-0.35, 0.05, dir.y));
}

void main() {
  // Screen space from the top left, matching the water texture's orientation.
  vec2 suv = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uRes;

  // Surfacing state, z-driven. The bead sits almost exactly where it will
  // rest and climbs toward the eye instead of sliding up the screen: while
  // it is still under water it is smaller, dimmer and water-cooled, its
  // silhouette bent by the surface, and it blooms to full size as it clears
  // the pool.
  vec2 rest = (suv - uCenter) * uRes / uRadius;
  float sub = uFade;

  vec2 dn = (suv - (uCenter + vec2(0.0, uDip))) * uRes / uRadius;
  // Under water the pool gently bends the edges of the sphere — a whisper of
  // it, or the submerged phase reads as a smear instead of water.
  dn.x += sub * (sin(rest.y * 7.0 + uTime * 2.2) * 0.05 + sin(rest.y * 13.0 - uTime * 3.3) * 0.025);
  dn.y += sub * sin(rest.x * 8.0 + uTime * 1.8) * 0.03;
  float r = length(dn);
  float mask = 1.0 - smoothstep(0.96, 1.0, r);

  // A soft pool of shade where the bead presses into the surface.
  vec2 sh = ((suv - (uCenter + vec2(0.0, uRadius * 0.92 / uRes.y))) * uRes) / uRadius;
  float contact = 1.0 - smoothstep(0.0, 1.05, length(sh * vec2(1.0, 0.78) - vec2(0.28, 0.10)));
  float alpha = contact * (1.0 - mask) * 0.16;
  vec3 color = vec3(0.0);

  if (mask > 0.001) {
    float zh = sqrt(max(1.0 - dot(dn, dn), 0.0));
    vec3 E = vec3(dn.x, dn.y, zh);       // entry point on the front hemisphere
    vec3 n1 = E;
    vec3 rd = vec3(0.0, 0.0, -1.0);
    float cosi = clamp(dot(-rd, n1), 0.0, 1.0);
    float F = 0.04 + 0.96 * pow(1.0 - cosi, 5.0);

    vec3 P = E;
    vec3 D = refract(rd, n1, 1.0 / 1.5);
    float weight = 1.0;
    vec2 land = E.xy;
    for (int i = 0; i < 3; i++) {
      vec3 P2 = P + (-2.0 * dot(P, D)) * D;
      vec3 outDir = refract(D, -P2, 1.5);
      if (dot(outDir, outDir) < 1e-5) {
        // Total internal reflection: the light bounces and tries the far side.
        D = reflect(D, P2);
        P = P2;
        weight *= 0.85;
      } else {
        // Where the ray lands on the water plane, 0.42 radii below centre:
        // closer than the true depth, so the pool reads magnified and bent,
        // the way a solid glass sphere magnifies what is under it.
        float tp = (-0.42 - P2.z) / outDir.z;
        land = P2.xy + tp * outDir.xy;
        break;
      }
    }

    // Dispersion: blue lands a touch further out than red.
    vec2 landUv = clamp(uCenter + land * (uRadius / uRes), vec2(0.001), vec2(0.999));
    vec2 away = (landUv - uCenter) * 0.075;
    vec4 wR = texture2D(uWater, clamp(landUv + away, 0.001, 0.999));
    vec4 wG = texture2D(uWater, landUv);
    vec4 wB = texture2D(uWater, clamp(landUv - away, 0.001, 0.999));
    // The texture stores the water layer over transparent pixels; the eye
    // sees it composited on the page, so mix out to the paper colour.
    vec3 bg = vec3(
      mix(1.0, wR.r, wR.a),
      mix(1.0, wG.g, wG.a),
      mix(1.0, wB.b, wB.a)
    );

    // Water barely tints the chord the light travels inside: the glass reads
    // clear, not milky.
    float chord = 2.0 * zh;
    vec3 tint = exp(-vec3(0.030, 0.008, 0.018) * chord);

    color = bg * tint * (1.0 - F) * weight;

    // The sky turns on the sphere, weighted by Fresnel. This term must stay
    // at pool brightness or the silhouette dips below the water and reads as
    // a thin dark outline.
    color += sky(reflect(rd, n1)) * F * 0.60;

    // The key light's flash over a broad sheen from the whole dome.
    vec3 L = normalize(vec3(-0.30, 0.62, 0.72));
    vec3 R = normalize(reflect(-L, n1));
    float flash = pow(max(dot(R, vec3(0.0, 0.0, 1.0)), 0.0), 380.0);
    float sheen = pow(max(dot(R, vec3(0.0, 0.0, 1.0)), 0.0), 18.0) * 0.06;
    color += vec3(0.98, 1.0, 1.0) * (flash * 1.2 + sheen);

    // A soft internal caustic gathers opposite the key light, as in real glass.
    color += vec3(0.88, 0.94, 1.0) * pow(max(dot(n1, vec3(0.30, -0.62, 0.72)), 0.0), 5.0) * 0.10;

    // Grazing rays gather along the silhouette, then the rim itself is pulled
    // to a bright polished edge — the way a real bead goes luminous where its
    // wall turns to the light. This is what keeps the anti-aliased boundary
    // pixels from dipping below the water and reading as a dark outline.
    float edge = smoothstep(0.90, 1.0, r);
    color = mix(color, vec3(0.93, 0.97, 0.99), edge * 0.9);

    color += (hash(gl_FragCoord.xy) - 0.5) / 255.0;

    // Where the glass wall turns away from the eye the refraction loses
    // resolve: the image melts into the pool directly beneath, the wall goes
    // slightly translucent, and the silhouette feathers out a little wider.
    float wall = smoothstep(0.86, 1.0, r);
    vec4 under = texture2D(uWater, suv);
    vec3 beneath = vec3(
      mix(1.0, under.r, under.a),
      mix(1.0, under.g, under.a),
      mix(1.0, under.b, under.a)
    );
    color = mix(color, beneath, wall * 0.5);

    alpha = mask;
    alpha *= 1.0 - 0.25 * wall;
    alpha *= smoothstep(1.0, 0.965, r) * 0.9 + 0.1;

    // Under water it reads as a small, dim, water-cooled ghost; the surface
    // look releases as the bead clears the pool.
    alpha *= 1.0 - 0.85 * sub;
    color = mix(color, beneath, sub * 0.45);
    color = mix(color, color * vec3(0.90, 0.97, 1.05), sub * 0.55);
    color += sub * 0.03 * vec3(1.0)
      * (0.5 + 0.5 * sin(rest.x * 24.0 + uTime * 6.0))
      * (0.5 + 0.5 * sin(rest.y * 30.0 - uTime * 9.0));
  }

  float outAlpha = clamp(alpha, 0.0, 1.0);
  gl_FragColor = vec4(clamp(color, 0.0, 1.0), outAlpha);
}
`

export function createBeadScene(
  canvas: HTMLCanvasElement,
  waterCanvas: HTMLCanvasElement,
  { reducedMotion = false, introDelay = 0.35 } = {},
): BeadSceneHandle | null {
  // The bead refracts the live water. If the water fell back to its 2D canvas
  // the source is hidden and there is nothing worth refracting.
  if (getComputedStyle(waterCanvas).visibility === 'hidden') return null

  const container = (waterCanvas.closest('section') ?? waterCanvas.parentElement ?? waterCanvas) as HTMLElement

  const t0 = performance.now()
  // Surfacing choreography, z-driven: the bead barely translates — it climbs
  // out of the depth instead, growing from a small watery shape to full size
  // as it clears the surface, then pops out with a splash of ripples.
  const RISE_DUR = 1.2
  const DIP0 = 0.07
  const riseStart = introDelay
  const splash = { fired: false }

  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      depth: false,
      stencil: false,
    })
  } catch {
    return null
  }
  renderer.setClearColor(new THREE.Color(0, 0, 0), 0)

  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  // The live water, re-uploaded every frame. flipY stays off because the water
  // canvas is fed to us top-row-first and the shader reads it the same way.
  const water = new THREE.CanvasTexture(waterCanvas)
  water.flipY = false
  water.minFilter = THREE.LinearFilter
  water.magFilter = THREE.LinearFilter
  water.wrapS = THREE.ClampToEdgeWrapping
  water.wrapT = THREE.ClampToEdgeWrapping

  const uniforms: Record<string, THREE.IUniform> = {
    uWater: { value: water },
    uRes: { value: new THREE.Vector2(709, 940) },
    uCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uRadius: { value: 240 },
    uTime: { value: 0 },
    uDip: { value: reducedMotion ? 0 : DIP0 },
    uFade: { value: reducedMotion ? 0 : 1 },
  }
  // The resting bead size; the uniform itself grows while the bead rises.
  let baseRadius = 240
  // No blending: the shader writes (color, alpha) straight into the buffer.
  // With normal blending the pixel color would land in the buffer already
  // multiplied by alpha, and the compositor multiplies again at every
  // partially transparent pixel — which painted a dark outline around the
  // anti-aliased bead edge.
  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    blending: THREE.NoBlending,
    depthTest: false,
    depthWrite: false,
  })
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
  scene.add(quad)

  let tick = 0
  let frame = 0
  let reduced = false

  const renderOnce = () => {
    const now = (performance.now() - t0) / 1000
    uniforms.uTime.value = now
    if (!reduced) {
      const rise = Math.min(Math.max((now - riseStart) / RISE_DUR, 0), 1)
      const eased = 1 - (1 - rise) ** 3
      // The climb is depth, not distance across the screen: barely a nudge of
      // translation, all the emphasis on the bead growing out of the water.
      uniforms.uDip.value = (1 - eased) * DIP0
      uniforms.uRadius.value = baseRadius
        * (0.79 + 0.21 * eased + Math.sin(rise * Math.PI * 2 - Math.PI) * 0.03)
      uniforms.uFade.value = 1 - rise
      if (!splash.fired && rise > 0.3 && uniforms.uRadius.value >= baseRadius * 0.96) {
        // The bead pops through the surface: push a matching disturbance into
        // the live water simulation, so circular ripples spread from exactly
        // where it broke out.
        splash.fired = true
        const rect = canvas.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const splashEvent = (dx: number, dy: number) =>
          new PointerEvent('pointerdown', { clientX: cx + dx, clientY: cy + dy, bubbles: true })
        container.dispatchEvent(splashEvent(0, 0))
        container.dispatchEvent(splashEvent(-7, 2))
        container.dispatchEvent(splashEvent(7, 2))
      }
    }
    // Pick up whatever the water pass drew most recently.
    water.needsUpdate = true
    renderer.render(scene, camera)
  }
  reduced = reducedMotion

  const resize = () => {
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight
    if (!width || !height) return
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
    renderer.setPixelRatio(ratio)
    renderer.setSize(width, height, false)
    uniforms.uRes.value.set(canvas.width, canvas.height)
    uniforms.uCenter.value.set(0.5, 0.5)
    baseRadius = Math.min(width, height) * 0.13 * 1.8 * ratio
    uniforms.uRadius.value = baseRadius
    if (reduced) renderOnce()
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)
  resize()

  if (reduced) renderOnce()
  else {
    frame = requestAnimationFrame(function loop() {
      frame = requestAnimationFrame(loop)
      // The refraction only follows the pool when the pool texture is fresh.
      if (tick % 2 === 0 || window.innerWidth >= 640) renderOnce()
      tick += 1
    })
  }

  // Stop burning frames while the hero is off-screen or the tab is hidden; the
  // water pass pauses with the tab, and we resume the same way it does.
  const loopBody = () => {
    frame = requestAnimationFrame(loopBody)
    if (tick % 2 === 0 || window.innerWidth >= 640) renderOnce()
    tick += 1
  }
  const startLoop = () => {
    if (frame || document.hidden || reduced || !pool) return
    frame = requestAnimationFrame(loopBody)
  }
  const stopLoop = () => {
    if (frame) cancelAnimationFrame(frame)
    frame = 0
  }

  // If the pool loses its context the water pass swaps in a 2D stand-in and
  // hides the original canvas. Refracting a canvas that no longer renders gave
  // a flat white disc, so the bead steps aside until the pool is back.
  let pool = true
  const onWaterLost = () => {
    pool = false
    stopLoop()
    canvas.style.opacity = '0'
  }
  const onWaterRestored = () => {
    pool = true
    canvas.style.opacity = ''
    startLoop()
  }
  waterCanvas.addEventListener('webglcontextlost', onWaterLost)
  waterCanvas.addEventListener('webglcontextrestored', onWaterRestored)

  const intersection = new IntersectionObserver((entries) => {
    const onScreen = entries.some((entry) => entry.isIntersecting)
    if (onScreen) startLoop()
    else stopLoop()
  })
  intersection.observe(container)

  const onVisibility = () => {
    if (document.hidden) stopLoop()
    else startLoop()
  }
  document.addEventListener('visibilitychange', onVisibility)

  return {
    dispose: () => {
      stopLoop()
      waterCanvas.removeEventListener('webglcontextlost', onWaterLost)
      waterCanvas.removeEventListener('webglcontextrestored', onWaterRestored)
      intersection.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      material.dispose()
      quad.geometry.dispose()
      water.dispose()
      renderer.dispose()
    },
  }
}
