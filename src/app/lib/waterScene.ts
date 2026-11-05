/**
 * The hero *is* the water surface.
 *
 * A shallow pool seen from above, drawn as light rather than as colour: the
 * surface focuses sunlight onto the bottom in caustics, bends that light on its
 * way, and catches the sky on the crests.
 *
 * The ripples are not a loop of sine waves. A real height field is simulated on
 * the CPU - the finite-difference scheme a pond uses - and uploaded as a float
 * texture every frame. The shader reads its slope, so a touch travels outwards,
 * interferes with the one before it and fades, instead of pulsing in place.
 *
 * Everything lives in screen space: the pool is the viewport, so the ripple
 * grid and the caustics share one coordinate system. Heights travel in an
 * 8-bit texture, which filters everywhere; without WebGL2 the 2D fallback
 * draws a quieter version.
 *
 * The glass bead is a separate pass in three.js (lib/beadScene.ts): it reads
 * this canvas every frame and refracts it.
 *
 * If the browser exposes HTML-in-Canvas (layoutsubtree with texElementImage2D,
 * separately behind a Chrome flag or origin trial), the real <h1> is lifted
 * into the water canvas and handed to the shader as a texture, so the type is
 * composited *under* the water and bends with every ripple. Without the API the
 * DOM overlay stays exactly as before.
 */

const VERT = /* glsl */ `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

const FRAG = /* glsl */ `
precision highp float;

varying vec2 vUv;
uniform sampler2D uHmap;
uniform vec2 uTexel;
uniform vec2 uRes;
uniform float uTime;
uniform float uAspect;
uniform sampler2D uTitle;
uniform vec4 uTitleRect;
uniform float uTitleOn;
uniform float uTitleOnly;

// The caustic net: four warped gratings whose crossings are the places where a
// surface focuses light onto the floor. Sharpened into filaments, not blobs.
float caustic(vec2 p, float tm) {
  vec2 i = p;
  float c = 1.0;
  float inten = 0.005;
  for (int n = 0; n < 4; n++) {
    float tt = tm * (1.0 - (3.5 / float(n + 1)));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
  }
  c /= 4.0;
  c = 1.17 - pow(c, 1.4);
  return pow(abs(c), 8.0);
}

void main() {
  vec2 uv = vUv;

  // Heights are stored as 8-bit so the texture stays filterable everywhere;
  // decode back to -1..1, then read the slope across one texel.
  float hl = texture2D(uHmap, uv - vec2(uTexel.x, 0.0)).r * 2.0 - 1.0;
  float hr = texture2D(uHmap, uv + vec2(uTexel.x, 0.0)).r * 2.0 - 1.0;
  float hd = texture2D(uHmap, uv - vec2(0.0, uTexel.y)).r * 2.0 - 1.0;
  float hu = texture2D(uHmap, uv + vec2(0.0, uTexel.y)).r * 2.0 - 1.0;
  vec2 slope = vec2(hr - hl, hu - hd) * 1.6;
  vec2 bend = slope * 0.30;

  // What the surface does to the light under it: the caustic field is sampled
  // through the bend, so every ripple distorts the pattern it passes over.
  vec2 cp = mod((uv + bend * 0.55) * vec2(uAspect, 1.0) * 11.0, 6.2831) - 250.0;
  float cs = clamp(caustic(cp, uTime * 0.42 + 23.0) * 1.15, 0.0, 1.4);
  float lit = clamp(cs, 0.0, 1.0);

  // Pale water where the floor is shaded, white where the light lands in a
  // filament: on a white page the pool is read through its shadows.
  vec3 shade = vec3(0.44, 0.63, 0.78);
  vec3 col = mix(shade, vec3(1.0), pow(lit, 0.85));

  // A crest holds a little sky. Flat water does not - only facets tilted at the
  // light glint - which keeps highlights as specks instead of fog.
  vec3 n = normalize(vec3(-slope * 70.0, 1.0));
  vec3 L = normalize(vec3(0.32, 0.48, 0.80));
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 110.0);
  col += vec3(1.0) * spec * 0.9;

  // A hard bend splits the light a little, the way a lens fringe does.
  col += vec3(0.04, 0.0, -0.03) * clamp(length(bend) * 10.0, 0.0, 1.0);

  float alpha = mix(0.32, 0.05, lit) + spec * 0.20;

  // Thin the water towards the top and behind the title: the page stays white
  // where the type has to be read, and the pool reads strongest through the
  // middle of the frame.
  alpha *= 0.20 + 0.80 * smoothstep(0.05, 0.60, uv.y);
  if (uTitleOn < 0.5) {
    // With the type in the DOM this band goes almost clear so the letters stay
    // crisp. Once the type is baked under the water the composite handles it.
    alpha *= mix(1.0, 0.20, smoothstep(0.68, 0.94, uv.y));
  }

  // A hair of dither against banding in the pale gradients.
  float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  col += dither / 255.0;

  // The baked type, kept as its own layer so the overlay pass can draw only
  // it: each wavelength bends with the surface, and the caustic light lands
  // on the letters exactly as it lands on the floor.
  vec4 titleLayer = vec4(0.0);
  if (uTitleOn > 0.5 && uTitleRect.z > 0.0 && uTitleRect.w > 0.0) {
    vec2 tUv = (uv - uTitleRect.xy) / uTitleRect.zw;
    if (tUv.x > 0.0 && tUv.x < 1.0 && tUv.y > 0.0 && tUv.y < 1.0) {
      vec2 lo = uTitleRect.xy;
      vec2 hi = uTitleRect.xy + uTitleRect.zw;
      // Heat haze: a slow ambient shimmer that owes nothing to the ripples,
      // so the air over the letters never quite settles.
      vec2 haze = vec2(
        sin(uv.x * 21.0 + uTime * 1.15) * 0.55 + sin(uv.x * 8.0 - uTime * 0.55) * 0.45,
        cos(uv.y * 17.0 - uTime * 0.95) * 0.50 + sin(uv.y * 6.0 + uTime * 0.50) * 0.50
      ) * 0.003;
      vec4 tSub = texture2D(uTitle, clamp(uv + haze, lo, hi));
      vec3 textCol = clamp(vec3(
        texture2D(uTitle, clamp(uv + bend * 0.90 + haze * 1.15, lo, hi)).r,
        tSub.g,
        texture2D(uTitle, clamp(uv + bend * 0.60 + haze * 0.85, lo, hi)).b
      ), 0.0, 1.0);
      textCol = mix(textCol, vec3(1.0), lit * 0.20);
      float textA = clamp(tSub.a, 0.0, 1.0);
      titleLayer = vec4(textCol * textA, textA);
    }
  }

  // Overlay pass: this canvas carries nothing but the refracted type, so it
  // can sit above the glass bead and the box frame without doubling the pool.
  if (uTitleOnly > 0.5) {
    gl_FragColor = vec4(titleLayer.rgb, titleLayer.a);
    return;
  }

  // The canvas is composited as premultiplied, so the shader must premultiply
  // too, or bright water at low alpha is added on top of the page as a stain.
  float outAlpha = clamp(alpha, 0.0, 1.0);
  vec3 outCol = clamp(col, 0.0, 1.0) * outAlpha;
  outCol += titleLayer.rgb * (1.0 - outAlpha);
  outAlpha = clamp(outAlpha + titleLayer.a * (1.0 - outAlpha), 0.0, 1.0);

  gl_FragColor = vec4(clamp(outCol, 0.0, 1.0), outAlpha);
}
`

type Field = { w: number; h: number; cur: Float32Array; prev: Float32Array }

export type WaterSceneHandle = {
  dispose: () => void
  /* Re-bakes the title texture from the current DOM, then draws. Used when the
     headline itself changes without a resize. */
  repaint?: () => void
}

function createField(w: number, h: number): Field {
  return { w, h, cur: new Float32Array(w * h), prev: new Float32Array(w * h) }
}

/** Adds a smooth pulse of energy to the field, in screen units (0..1). */
function inject(field: Field, u: number, v: number, radius: number, amp: number) {
  const { w, h, cur } = field
  const cx = u * w
  const cy = v * h
  const r = Math.max(2, radius)
  const x0 = Math.max(1, Math.floor(cx - r))
  const x1 = Math.min(w - 2, Math.ceil(cx + r))
  const y0 = Math.max(1, Math.floor(cy - r))
  const y1 = Math.min(h - 2, Math.ceil(cy + r))
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x - cx, y - cy) / r
      if (d < 1) cur[y * w + x] += amp * (Math.cos(d * Math.PI) * 0.5 + 0.5)
    }
  }
}

/** One step of the wave equation: each cell pulls on its four neighbours. */
function step(field: Field) {
  const { w, h, cur, prev } = field
  for (let y = 1; y < h - 1; y++) {
    const row = y * w
    for (let x = 1; x < w - 1; x++) {
      const i = row + x
      prev[i] = ((cur[i - 1] + cur[i + 1] + cur[i - w] + cur[i + w]) * 0.5 - prev[i]) * 0.982
    }
  }
  const swap = field.cur
  field.cur = field.prev
  field.prev = swap
}

type WaterOptions = {
  reducedMotion?: boolean
  bakeTitle?: HTMLElement | null
  /** Draw only the refracted type: a layer that can sit above the bead. */
  titleOnly?: boolean
}

type HtmlCanvasExtras = HTMLCanvasElement & { requestPaint?: () => void; onpaint?: unknown }

type WebGLBakeExtras = WebGL2RenderingContext & {
  texElementImage2D?: (
    target: number,
    level: number,
    internalformat: number,
    format: number,
    type: number,
    element: HTMLElement,
  ) => void
}

export function createWaterScene(
  canvas: HTMLCanvasElement,
  { reducedMotion = false, bakeTitle = null, titleOnly = false }: WaterOptions = {},
): WaterSceneHandle {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: true,
    // The bead pass reads this canvas back as a texture. Without a preserved
    // drawing buffer that read is only valid in the frame that drew it, so a
    // hero that was scrolled away and back can hand the bead blank pixels.
    preserveDrawingBuffer: !titleOnly,
    antialias: false,
    depth: false,
    stencil: false,
  }) as WebGL2RenderingContext | null
  if (!gl) return createFallbackWaterScene(canvas, reducedMotion)

  const container = (canvas.closest('section') ?? canvas.parentElement ?? canvas) as HTMLElement

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('water shader:', gl.getShaderInfoLog(shader))
      gl.deleteShader(shader)
      return null
    }
    return shader
  }

  const vertex = compile(gl.VERTEX_SHADER, VERT)
  const fragment = compile(gl.FRAGMENT_SHADER, FRAG)
  const program = gl.createProgram()
  if (!vertex || !fragment || !program) return createFallbackWaterScene(canvas, reducedMotion)
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('water link:', gl.getProgramInfoLog(program))
    return createFallbackWaterScene(canvas, reducedMotion)
  }
  gl.useProgram(program)

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(program, 'aPos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const at = (name: string) => gl.getUniformLocation(program, name)
  const uHmap = at('uHmap')
  const uTexel = at('uTexel')
  const uRes = at('uRes')
  const uTime = at('uTime')
  const uAspect = at('uAspect')
  gl.uniform1i(uHmap, 0)

  const texture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  // Unit 1 carries the baked title, when the browser can supply one.
  const uTitle = at('uTitle')
  const uTitleRect = at('uTitleRect')
  const uTitleOn = at('uTitleOn')
  gl.uniform1i(uTitle, 1)
  gl.uniform1f(uTitleOn, 0)
  gl.uniform1f(at('uTitleOnly'), titleOnly ? 1 : 0)
  const titleTexture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE1)
  gl.bindTexture(gl.TEXTURE_2D, titleTexture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]))
  gl.activeTexture(gl.TEXTURE0)

  let field = createField(2, 2)
  let bytes = new Uint8Array(4)
  let elapsed = 0
  let width = 1
  let height = 1
  let frame = 0
  let last = 0
  let tick = 0
  let onScreen = true
  let disposed = false
  let fallback: WaterSceneHandle | undefined

  const allocate = (w: number, h: number) => {
    field = createField(w, h)
    bytes = new Uint8Array(w * h)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, w, h, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, bytes)
    gl.uniform2f(uTexel, 1 / w, 1 / h)
  }

  /** Packs the signed height field into the 0..255 the texture can filter. */
  const upload = () => {
    const { cur } = field
    for (let i = 0; i < cur.length; i++) {
      const v = cur[i] * 0.5 + 0.5
      bytes[i] = v <= 0 ? 0 : v >= 1 ? 255 : (v * 255) | 0
    }
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, field.w, field.h, gl.LUMINANCE, gl.UNSIGNED_BYTE, bytes)
  }

  const draw = () => {
    if (fallback) return
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    upload()
    gl.uniform1f(uTime, elapsed)
    gl.uniform1f(uAspect, width / Math.max(height, 1))
    gl.uniform2f(uRes, width, height)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  const resize = () => {
    width = container.clientWidth || window.innerWidth
    height = container.clientHeight || window.innerHeight
    if (!width || !height) return
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
    canvas.width = Math.max(1, Math.round(width * ratio))
    canvas.height = Math.max(1, Math.round(height * ratio))
    // Keep the simulation cell square whatever the panel is doing.
    const gw = 192
    const gh = Math.max(32, Math.round(gw * (height / Math.max(width, 1))))
    if (field.w !== gw || field.h !== gh) allocate(gw, gh)
    if (bakedTitle) {
      updateTitleRect()
      rasterRepaint?.()
      ;(canvas as HtmlCanvasExtras).requestPaint?.()
    }
    // Paint the first frame eagerly, so the pool is there before the first
    // animation frame and the bead pass has something to refract the instant
    // it is created.
    draw()
  }

  // ---- HTML-in-Canvas: the real <h1> rendered under the water ----------------
  // Without that API the h1 is rasterized into the same shader path instead,
  // so the type lives under the simulated surface either way.
  let bakedTitle: HTMLElement | null = null
  let bakePaint: (() => void) | null = null
  let bakeRestore: { parent: Node; next: Node | null } | null = null
  let rasterLoop = 0
  let rasterRepaint: (() => void) | null = null

  const updateTitleRect = () => {
    if (!bakedTitle) return
    const rect = bakedTitle.getBoundingClientRect()
    const base = container.getBoundingClientRect()
    gl.uniform4f(
      uTitleRect,
      Math.max((rect.left - base.left) / Math.max(base.width, 1), 0),
      Math.max((rect.top - base.top) / Math.max(base.height, 1), 0),
      Math.max(rect.width, 1) / Math.max(base.width, 1),
      Math.max(rect.height, 1) / Math.max(base.height, 1),
    )
  }

  const restoreTitle = () => {
    if (rasterLoop) {
      cancelAnimationFrame(rasterLoop)
      rasterLoop = 0
    }
    rasterRepaint = null
    if (bakedTitle) {
      bakedTitle.removeAttribute('data-raster')
      // Nothing is painting the type any more: let the DOM copy be read.
      bakedTitle.removeAttribute('data-pending')
      bakedTitle.style.visibility = ''
      bakedTitle.style.position = ''
      bakedTitle.style.left = ''
      bakedTitle.style.top = ''
      bakedTitle.style.margin = ''
      try {
        bakeRestore?.parent.insertBefore(bakedTitle, bakeRestore.next)
      } catch {
        // The node is no longer where it was; leave it wherever it lives now.
      }
    }
    bakedTitle = null
    bakePaint = null
    gl.uniform1f(uTitleOn, 0)
  }

  const setupBake = (title: HTMLElement) => {
    const glBake = gl as WebGLBakeExtras
    const canvasBake = canvas as HtmlCanvasExtras
    if (typeof glBake.texElementImage2D !== 'function' || typeof canvasBake.requestPaint !== 'function') {
      setupRasterBake(title)
      return
    }
    try {
      const base = container.getBoundingClientRect()
      const rect = title.getBoundingClientRect()
      bakeRestore = { parent: title.parentNode as Node, next: title.nextSibling }
      title.style.position = 'absolute'
      title.style.margin = '0'
      title.style.left = `${Math.round(rect.left - base.left)}px`
      title.style.top = `${Math.round(rect.top - base.top)}px`
      canvas.setAttribute('layoutsubtree', '')
      canvas.appendChild(title)
      bakedTitle = title
      updateTitleRect()

      bakePaint = () => {
        if (!bakedTitle) return
        try {
          glBake.texElementImage2D!(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, title)
          gl.uniform1f(uTitleOn, 1)
          if (reducedMotion) draw()
        } catch {
          // The element refused to paint; go back to the DOM overlay.
          restoreTitle()
        }
      }
      canvas.addEventListener('paint', bakePaint)
      canvasBake.requestPaint!()
      window.setTimeout(() => {
        try {
          (canvas as HtmlCanvasExtras).requestPaint?.()
        } catch {
          // Painting again is best effort only.
        }
      }, 150)
    } catch {
      restoreTitle()
    }
  }

  // Without the HTML-in-Canvas API the h1 is rasterized in place into the
  // water texture, so the type is still composited UNDER the simulated
  // surface and bends with every ripple. A short loop mirrors the hero intro
  // motion into the texture — opacity, transform and blur are sampled from
  // the live element each frame — until it settles, then the frame refreezes.
  const setupRasterBake = (title: HTMLElement) => {
    // The rendering context, captured non-null: the hoisted paintRaster
    // function reads it from inside a nested frame.
    const glc: WebGL2RenderingContext = gl
    try {
      const rect = title.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      bakeRestore = { parent: title.parentNode as Node, next: title.nextSibling }
      title.style.visibility = 'hidden'
      // The DOM copy stays for selection; once the pass owns the visuals it
      // goes transparent (see styles.css) so drags highlight real text.
      title.setAttribute('data-raster', '')
      title.removeAttribute('data-pending')
      bakedTitle = title
      updateTitleRect()

      const raster = document.createElement('canvas')
      const ctx = raster.getContext('2d')
      if (!ctx) return
      const ctxExtra = ctx as CanvasRenderingContext2D & { letterSpacing?: string }
      let rasterWidth = 0
      let rasterHeight = 0

      paintRaster()
      rasterRepaint = () => {
        paintRaster()
        draw()
      }
      if (reducedMotion) return

      const startedAt = performance.now()
      let calmFrames = 0
      const introLoop = () => {
        try {
          paintRaster()
          draw()
        } catch (e) {
          console.warn('water: raster intro frame failed', e)
        }
        // The animated line is the h1's first child span, whatever the copy
        // inside it looks like; a deep selector breaks the moment the markup
        // gains another wrapper.
        const line = title.firstElementChild as HTMLElement | null
        const st = line ? getComputedStyle(line) : null
        const calm =
          !!st &&
          st.opacity === '1' &&
          (st.transform === 'none' || st.transform === 'matrix(1, 0, 0, 1, 0, 0)') &&
          (st.filter === 'none' || st.filter === 'blur(0px)')
        // The curtain plus the type's own delayed entrance can run past four
        // seconds on a first visit; keep mirroring until it has surely settled.
        if (calm || performance.now() - startedAt > 6500) {
          calmFrames += 1
          if (calmFrames >= 3) {
            rasterLoop = 0
            return
          }
        } else {
          calmFrames = 0
        }
        rasterLoop = requestAnimationFrame(introLoop)
      }
      rasterLoop = requestAnimationFrame(introLoop)

      // If the display fonts arrive late, refresh the frozen frame once.
      document.fonts?.ready.then(() => {
        if (!disposed && bakedTitle) rasterRepaint?.()
      }).catch(() => {})

      function paintRaster() {
        if (!bakedTitle || !ctx) return
        // The shader crops the type to this rect, so it has to be re-measured
        // with every bake: a swapped headline is a different width and sits
        // somewhere else, and a stale rect clips its ends off.
        updateTitleRect()
        const line = bakedTitle.firstElementChild as HTMLElement | null
        const st = line ? getComputedStyle(line) : null
        let opacity = 1
        let tx = 0
        let ty = 0
        let scale = 1
        let blurFilter = ''
        if (st) {
          opacity = Math.min(Math.max(parseFloat(st.opacity) || 1, 0), 1)
          if (st.transform && st.transform !== 'none') {
            const m = st.transform.match(/matrix\(([^)]+)\)/)
            if (m) {
              const p = m[1].split(',').map((v) => parseFloat(v))
              scale = Math.hypot(p[0], p[3]) || 1
              tx = p[4] || 0
              ty = p[5] || 0
            }
          }
          blurFilter = st.filter && st.filter !== 'none' ? st.filter : ''
        }

        // The shader samples the title texture in CONTAINER uv space, so the
        // raster covers the whole pool and the glyphs land where they belong.
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
        const w = Math.max(2, Math.round(container.clientWidth * ratio))
        const h = Math.max(2, Math.round(container.clientHeight * ratio))
        if (raster.width !== w || raster.height !== h) {
          raster.width = w
          raster.height = h
          rasterWidth = w
          rasterHeight = h
          ctx.setTransform(1, 0, 0, 1, 0, 0)
          ctx.clearRect(0, 0, w, h)
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, rasterWidth, rasterHeight)

        if (opacity > 0.004) {
          const base = container.getBoundingClientRect()
          const lRect = bakedTitle!.getBoundingClientRect()
          const lcx = (lRect.left + lRect.width / 2 - base.left) * scale
          const lcy = (lRect.top + lRect.height / 2 - base.top) * scale
          ctx.setTransform(
            ratio * scale,
            0,
            0,
            ratio * scale,
            ratio * (lcx - scale * lcx + tx),
            ratio * (lcy - scale * lcy + ty),
          )
          try {
            ctx.filter = blurFilter
          } catch {
            // Canvas filters are not everywhere; the blur simply softens.
          }
          const leaves = bakedTitle.querySelectorAll('span')
          leaves.forEach((el) => {
            const el2 = el as HTMLElement
            const label = (el2.textContent || '').replace(/\s+/g, ' ').trim()
            // Skip wrappers (they repeat their children's text) but keep runs
            // that merely carry decorative children, like the rule beside SIGN.
            if (!label) return
            if ([...el2.children].some((c) => (c.textContent || '').trim())) return
            const s = getComputedStyle(el2)
            const r = el2.getBoundingClientRect()
            ctx.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`
            try {
              ctxExtra.letterSpacing = s.letterSpacing
            } catch {
              // Letter spacing is a canvas nicety; the glyphs still land right.
            }
            // Once the DOM copy is transparent (--title-ink carries the real
            // colour) the raster must still paint what the reader sees.
            ctx.fillStyle = s.getPropertyValue('--title-ink').trim() || s.color
            ctx.textAlign = 'left'
            ctx.textBaseline = 'middle'
            ctx.fillText(label, r.left - base.left, r.top - base.top + r.height * 0.54)
          })
          try {
            ctx.filter = 'none'
          } catch {
            // Already best effort above.
          }
        }

        glc.activeTexture(glc.TEXTURE1)
        glc.bindTexture(glc.TEXTURE_2D, titleTexture)
        glc.texImage2D(glc.TEXTURE_2D, 0, glc.RGBA, glc.RGBA, glc.UNSIGNED_BYTE, raster)
        glc.uniform1f(uTitleOn, 1)
        if (reducedMotion) draw()
      }
    } catch (bakeError) {
      console.warn('water: raster bake failed', bakeError)
      restoreTitle()
    }
  }

  const atPoint = (event: { clientX: number; clientY: number }) => {
    const rect = container.getBoundingClientRect()
    return {
      u: (event.clientX - rect.left) / Math.max(rect.width, 1),
      v: (event.clientY - rect.top) / Math.max(rect.height, 1),
    }
  }

  let lastDrop = { u: -10, v: -10 }
  let lastDropAt = -1

  const ripple = (event: { clientX: number; clientY: number }, amp: number) => {
    const { u, v } = atPoint(event)
    if (u < -0.1 || u > 1.1 || v < -0.1 || v > 1.1) return
    // Enough travel and enough time between drops, or the pond just froths.
    const moved = Math.hypot(u - lastDrop.u, v - lastDrop.v)
    if (moved < 0.006 && elapsed - lastDropAt < 0.12) return
    inject(field, u, v, field.w * 0.022, amp)
    lastDrop = { u, v }
    lastDropAt = elapsed
    if (reducedMotion) draw()
  }

  const onPointerMove = (event: PointerEvent) => ripple(event, 0.16)
  const onPointerDown = (event: PointerEvent) => ripple(event, 0.5)
  const onTouchMove = (event: TouchEvent) => {
    if (event.touches[0]) ripple(event.touches[0], 0.16)
  }

  container.addEventListener('pointermove', onPointerMove, { passive: true })
  container.addEventListener('pointerdown', onPointerDown, { passive: true })
  container.addEventListener('touchmove', onTouchMove, { passive: true })

  const loop = (now: number) => {
    frame = requestAnimationFrame(loop)
    elapsed += Math.min((now - last) / 1000, 0.05)
    last = now
    // Halve the simulation on small screens: the eye cannot tell, the battery can.
    tick += 1
    if (tick % (width < 640 ? 2 : 1) === 0) step(field)
    draw()
  }

  const start = () => {
    if (disposed || reducedMotion || frame || fallback) return
    last = performance.now()
    frame = requestAnimationFrame(loop)
  }
  const stop = () => {
    if (frame) cancelAnimationFrame(frame)
    frame = 0
  }

  const observer = new ResizeObserver(() => {
    resize()
    if (reducedMotion) draw()
  })
  observer.observe(container)
  resize()

  if (bakeTitle) setupBake(bakeTitle)

  if (reducedMotion) draw()
  else start()

  const intersection = new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting
      if (onScreen && !document.hidden) start()
      else stop()
    },
    { threshold: 0.01 },
  )
  intersection.observe(container)

  const onVisibility = () => {
    if (!document.hidden && onScreen) start()
    else stop()
  }
  document.addEventListener('visibilitychange', onVisibility)

  const onContextLost = (event: Event) => {
    event.preventDefault()
    stop()
    if (!fallback) fallback = createFallbackWaterScene(canvas, reducedMotion)
  }
  canvas.addEventListener('webglcontextlost', onContextLost)

  return {
    repaint() {
      rasterRepaint?.()
      ;(canvas as HtmlCanvasExtras).requestPaint?.()
    },
    dispose() {
      disposed = true
      stop()
      observer.disconnect()
      intersection.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerdown', onPointerDown)
      container.removeEventListener('touchmove', onTouchMove)
      if (bakePaint) (canvas as HtmlCanvasExtras).removeEventListener('paint', bakePaint)
      restoreTitle()
      canvas.removeAttribute('layoutsubtree')
      gl.deleteTexture(texture)
      gl.deleteProgram(program)
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
      fallback?.dispose()
    },
  }
}

function createFallbackWaterScene(source: HTMLCanvasElement, reducedMotion: boolean): WaterSceneHandle {
  const canvas = document.createElement('canvas')
  canvas.className = source.className
  canvas.style.position = 'absolute'
  canvas.style.inset = '0'
  source.style.visibility = 'hidden'
  source.parentNode?.insertBefore(canvas, source.nextSibling)
  const ctx = canvas.getContext('2d')
  if (!ctx) return { dispose: () => { canvas.remove(); source.style.visibility = '' } }

  const container = (source.closest('section') ?? source.parentElement ?? source) as HTMLElement
  let width = 0
  let height = 0
  let time = 0
  let pointerX = 0
  let pointerY = 0
  let frame = 0
  let last = 0
  let onScreen = true
  let disposed = false

  const render = () => {
    ctx.clearRect(0, 0, width, height)
    const fade = ctx.createLinearGradient(0, 0, 0, height)
    fade.addColorStop(0, 'rgba(177, 207, 220, 0.30)')
    fade.addColorStop(0.5, 'rgba(177, 207, 220, 0.30)')
    fade.addColorStop(0.9, 'rgba(177, 207, 220, 0.05)')
    fade.addColorStop(1, 'rgba(177, 207, 220, 0.05)')
    ctx.fillStyle = fade
    ctx.fillRect(0, 0, width, height)
    ctx.lineWidth = 1.2
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.68)'
    ctx.shadowColor = 'rgba(255, 255, 255, 0.75)'
    ctx.shadowBlur = 3
    const spacing = Math.max(45, Math.min(width, height) * 0.16)
    const travel = time * 0.45
    for (let direction = 0; direction < 2; direction++) {
      ctx.save()
      if (direction) {
        ctx.translate(width, 0)
        ctx.rotate(Math.PI / 2)
      }
      const w = direction ? height : width
      const h = direction ? width : height
      for (let x = -spacing; x < w + spacing; x += spacing) {
        ctx.beginPath()
        for (let y = 0; y <= h + 30; y += 15) {
          const wave = Math.sin(y * 0.012 + x * 0.021 + travel) * spacing * 0.33
            + Math.sin(y * 0.021 - x * 0.009 - travel * 0.7) * spacing * 0.19
          const px = x + wave + (direction ? pointerY : pointerX) * 8
          if (y === 0) ctx.moveTo(px, y)
          else ctx.lineTo(px, y)
        }
        ctx.stroke()
      }
      ctx.restore()
    }
    ctx.shadowBlur = 0
  }

  const resize = () => {
    width = container.clientWidth
    height = container.clientHeight
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    render()
  }
  const loop = (now: number) => {
    if (last) time += Math.min((now - last) / 1000, 0.05)
    last = now
    render()
    frame = requestAnimationFrame(loop)
  }
  const start = () => {
    if (!frame && !reducedMotion && !disposed && onScreen && !document.hidden) frame = requestAnimationFrame(loop)
  }
  const stop = () => {
    cancelAnimationFrame(frame)
    frame = 0
    last = 0
  }
  const move = (point: { clientX: number; clientY: number }) => {
    const rect = container.getBoundingClientRect()
    pointerX = (point.clientX - rect.left) / rect.width - 0.5
    pointerY = (point.clientY - rect.top) / rect.height - 0.5
    if (reducedMotion) render()
  }
  const touch = (event: TouchEvent) => { if (event.touches[0]) move(event.touches[0]) }
  const visibility = () => { if (document.hidden) stop(); else start() }
  const observer = new ResizeObserver(resize)
  const intersection = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting
    if (onScreen) start()
    else stop()
  }, { threshold: 0.01 })
  observer.observe(container)
  intersection.observe(container)
  container.addEventListener('pointermove', move, { passive: true })
  container.addEventListener('touchmove', touch, { passive: true })
  document.addEventListener('visibilitychange', visibility)
  resize()
  start()

  return { dispose() {
    disposed = true
    stop()
    observer.disconnect()
    intersection.disconnect()
    container.removeEventListener('pointermove', move)
    container.removeEventListener('touchmove', touch)
    document.removeEventListener('visibilitychange', visibility)
    canvas.remove()
    source.style.visibility = ''
  } }
}
