export const vertexShaderSource = `
  attribute vec2 aPosition;

  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

export const fragmentShaderSource = `
  precision highp float;

  uniform vec2 uRes;
  uniform vec2 uMouse;
  uniform float uTime;
  uniform float uMethod;

  // --------------------------------
  // Utilities
  // --------------------------------

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);

    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(
      mix(a, b, f.x),
      mix(c, d, f.x),
      f.y
    );
  }

  // --------------------------------
  // Rounded rectangle
  // --------------------------------

  float roundedBox(
    vec2 p,
    vec2 size,
    float radius
  ) {
    vec2 q = abs(p) - size + radius;

    return length(max(q, 0.0))
      + min(max(q.x, q.y), 0.0)
      - radius;
  }

  // --------------------------------
  // Card material
  // --------------------------------

  vec3 cardMaterial(
    vec2 uv,
    vec2 mouse
  ) {
    float n = noise(uv * 9.0);

    // Soft directional gradient.
    vec3 base = mix(
      vec3(0.055, 0.065, 0.08),
      vec3(0.24, 0.27, 0.32),
      uv.x
    );

    // Brushed texture.
    float brush =
      noise(
        vec2(
          uv.x * 80.0,
          uv.y * 4.0
        )
      );

    base += brush * 0.025;
    base += n * 0.018;

    // Cursor highlight.
    float distanceToMouse =
      distance(uv, mouse);

    float highlight =
      1.0 -
      smoothstep(
        0.0,
        0.45,
        distanceToMouse
      );

    base += highlight * 0.30;

    // Small specular hotspot.
    float specular =
      pow(
        max(highlight, 0.0),
        5.0
      );

    base += specular * 0.25;

    return base;
  }

  // --------------------------------
  // UPI material
  // --------------------------------

  vec3 upiMaterial(
    vec2 uv,
    vec2 mouse
  ) {
    vec2 grid = uv * 48.0;

    vec2 cell = fract(grid);
    vec2 id = floor(grid);

    float pattern =
      step(
        0.52,
        hash(id)
      );

    // Small gaps between cells.
    float cellEdge =
      smoothstep(
        0.0,
        0.08,
        cell.x
      ) *
      smoothstep(
        0.0,
        0.08,
        cell.y
      );

    float pixel =
      pattern *
      cellEdge;

    vec3 dark =
      vec3(0.025, 0.03, 0.035);

    vec3 light =
      vec3(0.72, 0.76, 0.78);

    vec3 base =
      mix(
        dark,
        light,
        pixel
      );

    // Cursor distorts the grid locally.
    float mouseDistance =
      distance(uv, mouse);

    float influence =
      1.0 -
      smoothstep(
        0.0,
        0.42,
        mouseDistance
      );

    vec2 direction =
      normalize(
        uv - mouse + 0.0001
      );

    float ripple =
      sin(
        mouseDistance * 55.0 -
        uTime * 3.0
      );

    base +=
      influence *
      ripple *
      0.08;

    base +=
      influence *
      vec3(0.15);

    return base;
  }

  // --------------------------------
  // Wallet material
  // --------------------------------

  vec3 walletMaterial(
    vec2 uv,
    vec2 mouse
  ) {
    vec2 p =
      uv - 0.5;

    // Domain warp.
    float warp =
      noise(
        p * 3.5 +
        vec2(uTime * 0.05)
      );

    vec2 warped =
      p +
      vec2(
        warp * 0.12,
        warp * 0.08
      );

    float n =
      noise(
        warped * 5.0
      );

    n +=
      0.5 *
      noise(
        warped * 10.0 -
        uTime * 0.03
      );

    float glow =
      smoothstep(
        0.75,
        0.0,
        length(p)
      );

    vec3 base =
      mix(
        vec3(0.035, 0.015, 0.06),
        vec3(0.38, 0.10, 0.48),
        n
      );

    base +=
      glow *
      vec3(
        0.18,
        0.04,
        0.20
      );

    // Cursor creates a moving energy field.
    float mouseDistance =
      distance(uv, mouse);

    float influence =
      1.0 -
      smoothstep(
        0.0,
        0.5,
        mouseDistance
      );

    float pulse =
      0.5 +
      0.5 *
      sin(
        mouseDistance * 25.0 -
        uTime * 4.0
      );

    base +=
      influence *
      pulse *
      vec3(
        0.22,
        0.06,
        0.25
      );

    return base;
  }

  // --------------------------------
  // Main
  // --------------------------------

  void main() {

    // Correct for viewport aspect ratio.
    vec2 uv =
      gl_FragCoord.xy / uRes;

    vec2 centered =
      uv - 0.5;

    centered.x *=
      uRes.x / uRes.y;

    vec2 objectUV =
      centered /
      vec2(1.55, 0.88);

    objectUV += 0.5;

    // --------------------------------
    // Payment object
    // --------------------------------

    vec2 objectPosition =
      centered;

    float objectDistance =
      roundedBox(
        objectPosition,
        vec2(0.62, 0.34),
        0.075
      );

    float objectMask =
      1.0 -
      smoothstep(
        0.0,
        0.012,
        objectDistance
      );

    // Soft shadow.
    float shadowDistance =
      roundedBox(
        objectPosition +
        vec2(0.0, 0.025),
        vec2(0.62, 0.34),
        0.075
      );

    float shadow =
      1.0 -
      smoothstep(
        0.0,
        0.09,
        shadowDistance
      );

    // --------------------------------
    // Materials
    // --------------------------------

    vec3 card =
      cardMaterial(
        objectUV,
        uMouse
      );

    vec3 upi =
      upiMaterial(
        objectUV,
        uMouse
      );

    vec3 wallet =
      walletMaterial(
        objectUV,
        uMouse
      );

    vec3 material;

    if (uMethod < 1.0) {

      material =
        mix(
          card,
          upi,
          uMethod
        );

    } else {

      material =
        mix(
          upi,
          wallet,
          uMethod - 1.0
        );
    }

    // --------------------------------
    // Object edge
    // --------------------------------

    float edge =
      1.0 -
      smoothstep(
        0.0,
        0.025,
        abs(objectDistance)
      );

    material +=
      edge *
      vec3(0.12);

    // --------------------------------
    // Background
    // --------------------------------

    vec3 background =
      vec3(
        0.018,
        0.02,
        0.025
      );

    background +=
      0.015 *
      vec3(
        uv.y
      );

    // Shadow behind object.
    background =
      mix(
        background,
        vec3(0.005),
        shadow * 0.28
      );

    // --------------------------------
    // Composite
    // --------------------------------

    vec3 finalColor =
      mix(
        background,
        material,
        objectMask
      );

    gl_FragColor =
      vec4(
        finalColor,
        1.0
      );
  }
`;