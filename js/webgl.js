/* ============================================================
   js/webgl.js
   Background WebGL GLSL shader — réagit à la souris,
   change de couleur selon la section active.
============================================================ */

(function () {
  const canvas = document.getElementById('gl-canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) { canvas.style.display = 'none'; return; }

  /* ---------- Resize ---------- */
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  /* ---------- Shaders ---------- */
  const VS = `
    attribute vec2 a_pos;
    void main() {
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  const FS = `
    precision mediump float;

    uniform vec2  u_res;
    uniform float u_time;
    uniform vec2  u_mouse;
    uniform vec3  u_c1;
    uniform vec3  u_c2;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i),            hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x),
        u.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p  = p * 2.1 + vec2(1.3, 0.7);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_res;
      /* flip Y pour que l'axe souris corresponde */
      vec2 mu = vec2(u_mouse.x / u_res.x, 1.0 - u_mouse.y / u_res.y);

      float t  = u_time * 0.14;

      /* Bruit multi-couches */
      float n = fbm(uv * 2.2 + t)
              + fbm(uv * 4.8 - t * 0.6) * 0.4;
      n = clamp(n, 0.0, 1.0);

      /* Influence de la souris */
      float md = length(uv - mu);
      float mo = smoothstep(0.55, 0.0, md) * 0.18;

      /* Grille ultra subtile */
      vec2  gf = fract(uv * vec2(36.0, 20.0));
      float gl2 = step(0.97, gf.x) + step(0.97, gf.y);

      /* Vignette */
      float vig = 1.0 - smoothstep(0.3, 1.0, length(uv - 0.5) * 1.4);

      /* Composition */
      vec3 base = vec3(0.018, 0.018, 0.018);
      vec3 col  = base
                + u_c1 * (n + mo) * 0.075 * vig
                + u_c2 * (1.0 - n + mo) * 0.04 * vig
                + u_c1 * gl2 * 0.018;

      /* Scanlines légères */
      float scan = sin(gl_FragCoord.y * 1.5) * 0.008 + 1.0;
      col *= scan;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compileShader(src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('Shader error:', gl.getShaderInfoLog(s));
    }
    return s;
  }

  const prog = gl.createProgram();
  gl.attachShader(prog, compileShader(VS, gl.VERTEX_SHADER));
  gl.attachShader(prog, compileShader(FS, gl.FRAGMENT_SHADER));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  /* Quad plein écran */
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([-1,-1, 1,-1, -1,1, 1,1]),
    gl.STATIC_DRAW
  );
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  /* Uniforms */
  const uRes   = gl.getUniformLocation(prog, 'u_res');
  const uTime  = gl.getUniformLocation(prog, 'u_time');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');
  const uC1    = gl.getUniformLocation(prog, 'u_c1');
  const uC2    = gl.getUniformLocation(prog, 'u_c2');

  /* -------- Palette par section -------- */
  /* chaque entrée = [c1_r, c1_g, c1_b,   c2_r, c2_g, c2_b] */
  const palettes = [
    [0.663, 1.000, 0.243,  0.000, 0.898, 1.000],  // 01 hero    — vert/cyan
    [0.400, 0.100, 1.000,  0.663, 0.100, 1.000],  // 02 work    — violet
    [1.000, 0.380, 0.100,  1.000, 0.780, 0.000],  // 03 about   — orange/or
    [0.663, 1.000, 0.243,  0.000, 0.898, 1.000],  // 04 contact — vert/cyan
  ];

  let current = palettes[0].slice();
  let target  = palettes[0].slice();

  /* Expose pour main.js */
  window.glSetSection = function (idx) {
    target = palettes[Math.min(idx, palettes.length - 1)].slice();
  };

  /* Mouse */
  const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  /* Lerp helper */
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* Render loop */
  function render(ts) {
    const t = ts * 0.001;

    /* Interpolation douce des couleurs */
    for (let i = 0; i < 6; i++) {
      current[i] = lerp(current[i], target[i], 0.025);
    }

    gl.uniform2f(uRes,   canvas.width, canvas.height);
    gl.uniform1f(uTime,  t);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform3f(uC1, current[0], current[1], current[2]);
    gl.uniform3f(uC2, current[3], current[4], current[5]);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

})();