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
  uniform float uCharge;
  uniform float uState;

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

  float roundedBox(
    vec2 p,
    vec2 size,
    float radius
  ) {
    vec2 q =
      abs(p) - size + radius;

    return length(max(q, 0.0))
      + min(max(q.x, q.y), 0.0)
      - radius;
  }

  float circle(
    vec2 p,
    vec2 center,
    float radius
  ) {
    return length(p - center) - radius;
  }

  float lineSegment(
    vec2 p,
    vec2 a,
    vec2 b,
    float width
  ) {
    vec2 pa = p - a;
    vec2 ba = b - a;

    float h = clamp(
      dot(pa, ba) / dot(ba, ba),
      0.0,
      1.0
    );

    return length(pa - ba * h) - width;
  }

  float finder(
    vec2 p,
    vec2 origin,
    float size
  ) {
    vec2 q = p - origin;

    float outer =
      step(0.0, q.x) *
      step(q.x, size) *
      step(0.0, q.y) *
      step(q.y, size);

    float inner =
      step(0.13 * size, q.x) *
      step(q.x, 0.87 * size) *
      step(0.13 * size, q.y) *
      step(q.y, 0.87 * size);

    float core =
      step(0.32 * size, q.x) *
      step(q.x, 0.68 * size) *
      step(0.32 * size, q.y) *
      step(q.y, 0.68 * size);

    return outer *
      (1.0 - inner + core);
  }

  vec3 cardMaterial(
    vec2 uv,
    vec2 mouse
  ) {
    float n = noise(uv * 9.0);

    vec3 base = mix(
      vec3(0.045, 0.055, 0.075),
      vec3(0.28, 0.31, 0.38),
      uv.x
    );

    float brush = noise(
      vec2(
        uv.x * 80.0,
        uv.y * 4.0
      )
    );

    base += brush * 0.025;
    base += n * 0.018;

    float mouseGlow =
      1.0 -
      smoothstep(
        0.0,
        0.48,
        distance(uv, mouse)
      );

    base += mouseGlow * 0.25;

    // Card chip.
    float chip =
      1.0 -
      smoothstep(
        0.0,
        0.012,
        roundedBox(
          uv - vec2(0.19, 0.68),
          vec2(0.09, 0.055),
          0.018
        )
      );

    base = mix(
      base,
      vec3(0.64, 0.49, 0.22),
      chip
    );

    // Contactless symbol.
    float contactless =
      1.0 -
      smoothstep(
        0.0,
        0.012,
        abs(
          distance(
            uv,
            vec2(0.76, 0.69)
          ) - 0.055
        )
      );

    base += contactless *
      vec3(0.9);

    return base;
  }

  vec3 upiMaterial(
    vec2 uv,
    vec2 mouse
  ) {
    vec2 grid = uv * 22.0;
    vec2 cell = floor(grid);
    vec2 local = fract(grid);

    float pattern =
      step(0.56, hash(cell));

    float finderA =
      finder(
        uv,
        vec2(0.06, 0.68),
        0.24
      );

    float finderB =
      finder(
        uv,
        vec2(0.70, 0.68),
        0.24
      );

    float finderC =
      finder(
        uv,
        vec2(0.06, 0.08),
        0.24
      );

    float qr =
      max(
        pattern,
        max(
          finderA,
          max(finderB, finderC)
        )
      );

    float gaps =
      step(0.12, local.x) *
      step(0.12, local.y);

    qr *= gaps;

    vec3 dark =
      vec3(0.035, 0.04, 0.05);

    vec3 light =
      vec3(0.86, 0.89, 0.84);

    vec3 base =
      mix(light, dark, qr);

    float glow =
      1.0 -
      smoothstep(
        0.0,
        0.5,
        distance(uv, mouse)
      );

    base += glow * 0.12;

    return base;
  }

  vec3 walletMaterial(
    vec2 uv,
    vec2 mouse
  ) {
    vec3 base = mix(
      vec3(0.055, 0.06, 0.075),
      vec3(0.23, 0.25, 0.29),
      uv.y
    );

    float flap =
      1.0 -
      smoothstep(
        0.0,
        0.018,
        abs(uv.y - 0.37)
      );

    base += flap * 0.10;

    float coin =
      1.0 -
      smoothstep(
        0.0,
        0.018,
        circle(
          uv,
          vec2(0.70, 0.34),
          0.10
        )
      );

    base = mix(
      base,
      vec3(0.76, 0.61, 0.22),
      coin
    );

    float glow =
      1.0 -
      smoothstep(
        0.0,
        0.55,
        distance(uv, mouse)
      );

    base += glow * 0.22;

    return base;
  }

  void main() {
    vec2 uv =
      gl_FragCoord.xy / uRes;

    vec2 centered =
      uv - 0.5;

    centered.x *=
      uRes.x / uRes.y;

    vec2 objectUV =
      centered / vec2(1.48, 0.84);

    objectUV += 0.5;

    vec2 objectPosition =
      centered;

    float objectDistance =
      roundedBox(
        objectPosition,
        vec2(0.45, 0.25),
        0.055
      );

    float objectMask =
      1.0 -
      smoothstep(
        0.0,
        0.012,
        objectDistance
      );

    float shadowDistance =
      roundedBox(
        objectPosition +
        vec2(0.0, 0.025),
        vec2(0.45, 0.25),
        0.055
      );

    float shadow =
      1.0 -
      smoothstep(
        0.0,
        0.10,
        shadowDistance
      );

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
      material = card;
    } else if (uMethod < 2.0) {
      material = upi;
    } else {
      material = wallet;
    }

    // Payment progress sweep.
    float sweep =
      smoothstep(
        uCharge - 0.10,
        uCharge,
        objectUV.x
      ) *
      step(0.01, uCharge);

    vec3 accent =
      vec3(
        0.72,
        0.92,
        0.18
      );

    material +=
      sweep *
      0.12;

    material +=
      sweep *
      accent *
      0.28;

    // Subtle charge glow.
    float chargeGlow =
      uCharge *
      (
        0.5 +
        0.5 *
        sin(uTime * 7.0)
      );

    material +=
      chargeGlow *
      accent *
      0.06;

    // Success.
    if (uState > 1.5 && uState < 2.5) {
      vec3 success =
        vec3(
          0.35,
          0.92,
          0.55
        );

      float ring =
        1.0 -
        smoothstep(
          0.0,
          0.025,
          abs(
            distance(
              objectUV,
              vec2(0.5)
            ) - 0.16
          )
        );

      float checkA =
        1.0 -
        smoothstep(
          0.0,
          0.025,
          lineSegment(
            objectUV,
            vec2(0.43, 0.50),
            vec2(0.48, 0.45),
            0.012
          )
        );

      float checkB =
        1.0 -
        smoothstep(
          0.0,
          0.025,
          lineSegment(
            objectUV,
            vec2(0.48, 0.45),
            vec2(0.59, 0.57),
            0.012
          )
        );

      material +=
        success *
        ring *
        0.55;

      material +=
        success *
        max(checkA, checkB) *
        0.9;
    }

    // Cancelled.
    if (uState > 2.5 && uState < 3.5) {
      vec3 warning =
        vec3(
          0.96,
          0.66,
          0.25
        );

      float edge =
        1.0 -
        smoothstep(
          0.0,
          0.035,
          abs(objectDistance)
        );

      material +=
        warning *
        edge *
        0.75;
    }

    // Failed.
    if (uState > 3.5) {
      vec3 error =
        vec3(
          0.96,
          0.30,
          0.30
        );

      float edge =
        1.0 -
        smoothstep(
          0.0,
          0.035,
          abs(objectDistance)
        );

      float crossA =
        1.0 -
        smoothstep(
          0.0,
          0.025,
          lineSegment(
            objectUV,
            vec2(0.44, 0.44),
            vec2(0.56, 0.56),
            0.012
          )
        );

      float crossB =
        1.0 -
        smoothstep(
          0.0,
          0.025,
          lineSegment(
            objectUV,
            vec2(0.56, 0.44),
            vec2(0.44, 0.56),
            0.012
          )
        );

      material +=
        error *
        edge *
        0.75;

      material +=
        error *
        max(crossA, crossB) *
        0.8;
    }

    vec3 background =
      vec3(
        0.008,
        0.009,
        0.012
      );

    float backgroundGlow =
      1.0 -
      smoothstep(
        0.0,
        0.75,
        distance(
          centered,
          vec2(0.0)
        )
      );

    background +=
      backgroundGlow *
      vec3(
        0.012,
        0.014,
        0.018
      );

    background =
      mix(
        background,
        vec3(0.003),
        shadow * 0.25
      );

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