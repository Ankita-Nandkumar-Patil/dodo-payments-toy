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

  float roundedBox(
    vec2 p,
    vec2 size,
    float radius
  ) {
    vec2 q =
      abs(p) - size + radius;

    return
      length(max(q, 0.0))
      + min(max(q.x, q.y), 0.0)
      - radius;
  }

  float circle(
    vec2 p,
    vec2 center,
    float radius
  ) {
    return
      1.0 -
      smoothstep(
        radius,
        radius + 0.008,
        distance(p, center)
      );
  }

  float segment(
    vec2 p,
    vec2 a,
    vec2 b,
    float width
  ) {
    vec2 pa = p - a;
    vec2 ba = b - a;

    float h =
      clamp(
        dot(pa, ba) /
          dot(ba, ba),
        0.0,
        1.0
      );

    return
      1.0 -
      smoothstep(
        width,
        width + 0.008,
        length(pa - ba * h)
      );
  }

  // --------------------------------
  // Card
  // --------------------------------

  vec3 cardMaterial(
    vec2 uv,
    vec2 mouse
  ) {
    vec3 base =
      mix(
        vec3(0.055, 0.065, 0.09),
        vec3(0.16, 0.18, 0.23),
        uv.y
      );

    float brushed =
      noise(
        vec2(
          uv.x * 90.0,
          uv.y * 5.0
        )
      );

    base += brushed * 0.025;

    float mouseGlow =
      1.0 -
      smoothstep(
        0.0,
        0.55,
        distance(uv, mouse)
      );

    base +=
      mouseGlow *
      vec3(
        0.10,
        0.12,
        0.16
      );

    // Chip.
    float chip =
      1.0 -
      smoothstep(
        0.0,
        0.01,
        roundedBox(
          uv - vec2(0.20, 0.64),
          vec2(0.075, 0.052),
          0.018
        )
      );

    vec3 chipColor =
      vec3(
        0.70,
        0.58,
        0.30
      );

    base =
      mix(
        base,
        chipColor,
        chip * 0.75
      );

    // Chip lines.
    float chipLine =
      1.0 -
      smoothstep(
        0.0,
        0.012,
        abs(
          uv.x - 0.20
        )
      );

    chipLine *=
      smoothstep(
        0.58,
        0.60,
        uv.y
      ) *
      (1.0 -
        smoothstep(
          0.68,
          0.70,
          uv.y
        ));

    base +=
      chipLine *
      chip *
      0.12;

    // Contactless symbol.
    float contactless =
      segment(
        uv,
        vec2(0.77, 0.65),
        vec2(0.79, 0.65),
        0.012
      );

    contactless +=
      segment(
        uv,
        vec2(0.79, 0.67),
        vec2(0.82, 0.67),
        0.009
      );

    base +=
      contactless *
      vec3(
        0.75,
        0.78,
        0.82
      );

    return base;
  }

  // --------------------------------
  // UPI / QR
  // --------------------------------

  float finder(
    vec2 cell,
    vec2 origin
  ) {
    vec2 local =
      cell - origin;

    if (
      local.x < 0.0 ||
      local.x > 6.0 ||
      local.y < 0.0 ||
      local.y > 6.0
    ) {
      return 0.0;
    }

    float outer =
      step(0.0, local.x) *
      step(local.x, 6.0) *
      step(0.0, local.y) *
      step(local.y, 6.0);

    float border =
      step(local.x, 1.0) +
      step(5.0, local.x) +
      step(local.y, 1.0) +
      step(5.0, local.y);

    float center =
      step(2.0, local.x) *
      step(local.x, 4.0) *
      step(2.0, local.y) *
      step(local.y, 4.0);

    return outer *
      clamp(
        max(
          step(1.0, border),
          center
        ),
        0.0,
        1.0
      );
  }

  vec3 upiMaterial(
    vec2 uv,
    vec2 mouse
  ) {
    vec3 base =
      vec3(
        0.035,
        0.045,
        0.055
      );

    vec2 qr =
      (uv - 0.5) *
      1.25 +
      0.5;

    if (
      qr.x > 0.0 &&
      qr.x < 1.0 &&
      qr.y > 0.0 &&
      qr.y < 1.0
    ) {
      vec2 grid =
        floor(qr * 21.0);

      vec2 cell =
        fract(qr * 21.0);

      float pattern =
        step(
          0.58,
          hash(grid)
        );

      pattern =
        max(
          pattern,
          finder(
            grid,
            vec2(0.0, 0.0)
          )
        );

      pattern =
        max(
          pattern,
          finder(
            grid,
            vec2(14.0, 0.0)
          )
        );

      pattern =
        max(
          pattern,
          finder(
            grid,
            vec2(0.0, 14.0)
          )
        );

      float gap =
        smoothstep(
          0.03,
          0.12,
          cell.x
        ) *
        smoothstep(
          0.03,
          0.12,
          cell.y
        );

      pattern *= gap;

      base =
        mix(
          base,
          vec3(
            0.92,
            0.94,
            0.90
          ),
          pattern
        );
    }

    float ripple =
      1.0 -
      smoothstep(
        0.0,
        0.45,
        distance(
          uv,
          mouse
        )
      );

    base +=
      ripple *
      0.08;

    return base;
  }

  // --------------------------------
  // Wallet
  // --------------------------------

  vec3 walletMaterial(
    vec2 uv,
    vec2 mouse
  ) {
    vec3 base =
      mix(
        vec3(
          0.045,
          0.055,
          0.065
        ),
        vec3(
          0.14,
          0.16,
          0.18
        ),
        uv.y
      );

    float grain =
      noise(
        uv * 12.0
      );

    base +=
      grain * 0.018;

    float flap =
      1.0 -
      smoothstep(
        0.0,
        0.008,
        roundedBox(
          uv -
            vec2(
              0.50,
              0.70
            ),
          vec2(
            0.38,
            0.11
          ),
          0.035
        )
      );

    base +=
      flap *
      vec3(
        0.04,
        0.045,
        0.05
      );

    float coin =
      circle(
        uv,
        vec2(
          0.50,
          0.45
        ),
        0.075
      );

    base +=
      coin *
      vec3(
        0.72,
        0.76,
        0.80
      );

    float mouseGlow =
      1.0 -
      smoothstep(
        0.0,
        0.5,
        distance(
          uv,
          mouse
        )
      );

    base +=
      mouseGlow *
      vec3(
        0.08,
        0.10,
        0.12
      );

    return base;
  }

  // --------------------------------
  // Main
  // --------------------------------

  void main() {
    vec2 uv =
      gl_FragCoord.xy /
      uRes;

    vec2 centered =
      uv - 0.5;

    centered.x *=
      uRes.x /
      uRes.y;

    // Payment surface.
    vec2 objectCenter =
      centered +
      vec2(
        0.0,
        0.01
      );

    float objectDistance =
      roundedBox(
        objectCenter,
        vec2(
          0.58,
          0.32
        ),
        0.055
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
        objectCenter +
          vec2(
            0.0,
            0.035
          ),
        vec2(
          0.58,
          0.32
        ),
        0.055
      );

    float shadow =
      1.0 -
      smoothstep(
        0.0,
        0.11,
        shadowDistance
      );

    // UV inside payment surface.
    vec2 objectUV =
      objectCenter /
      vec2(
        0.58,
        0.32
      );

    objectUV =
      objectUV * 0.5 +
      0.5;

    // Cursor movement.
    vec2 localMouse =
      objectUV;

    // Charge deformation.
    float chargeInfluence =
      uCharge *
      (
        1.0 -
        smoothstep(
          0.0,
          0.65,
          distance(
            objectUV,
            localMouse
          )
        )
      );

    objectUV +=
      (
        localMouse -
        objectUV
      ) *
      chargeInfluence *
      0.05;

    vec3 card =
      cardMaterial(
        objectUV,
        localMouse
      );

    vec3 upi =
      upiMaterial(
        objectUV,
        localMouse
      );

    vec3 wallet =
      walletMaterial(
        objectUV,
        localMouse
      );

    vec3 material;

    if (
      uMethod < 1.0
    ) {
      material = card;
    } else if (
      uMethod < 2.0
    ) {
      material = upi;
    } else {
      material = wallet;
    }

    // --------------------------------
    // Payment state
    // --------------------------------

    vec3 accent =
      vec3(
        0.72,
        0.92,
        0.18
      );

    vec3 success =
      vec3(
        0.38,
        0.92,
        0.55
      );

    vec3 warning =
      vec3(
        0.96,
        0.66,
        0.25
      );

    vec3 error =
      vec3(
        0.96,
        0.30,
        0.30
      );

    // Charging energy.
    if (
      uState > 0.5 &&
      uState < 1.5
    ) {
      float sweep =
        fract(
          uTime * 0.35
        );

      float energy =
        1.0 -
        smoothstep(
          0.0,
          0.18,
          abs(
            objectUV.x -
            sweep
          )
        );

      material +=
        energy *
        uCharge *
        accent *
        0.16;

      float edge =
        1.0 -
        smoothstep(
          0.0,
          0.035,
          abs(
            objectDistance
          )
        );

      material +=
        edge *
        accent *
        uCharge *
        0.25;
    }

    // Success.
    if (
      uState > 1.5 &&
      uState < 2.5
    ) {
      float pulse =
        0.5 +
        0.5 *
        sin(
          uTime * 7.0
        );

      material =
        mix(
          material,
          material +
            success *
            0.20,
          0.7
        );

      float ring =
        abs(
          distance(
            objectUV,
            vec2(0.5)
          ) -
          0.18
        );

      material +=
        success *
        (
          1.0 -
          smoothstep(
            0.0,
            0.025,
            ring
          )
        ) *
        (0.25 + pulse * 0.15);

      // Check mark.
      float check =
        max(
          segment(
            objectUV,
            vec2(
              0.42,
              0.50
            ),
            vec2(
              0.48,
              0.44
            ),
            0.018
          ),
          segment(
            objectUV,
            vec2(
              0.48,
              0.44
            ),
            vec2(
              0.59,
              0.57
            ),
            0.018
          )
        );

      material =
        mix(
          material,
          success,
          check
        );
    }

    // Cancelled.
    if (
      uState > 2.5 &&
      uState < 3.5
    ) {
      float edge =
        1.0 -
        smoothstep(
          0.0,
          0.04,
          abs(
            objectDistance
          )
        );

      material +=
        warning *
        edge *
        0.35;
    }

    // Failed.
    if (
      uState > 3.5
    ) {
      float edge =
        1.0 -
        smoothstep(
          0.0,
          0.045,
          abs(
            objectDistance
          )
        );

      material +=
        error *
        edge *
        0.42;

      float cross =
        max(
          segment(
            objectUV,
            vec2(
              0.43,
              0.43
            ),
            vec2(
              0.57,
              0.57
            ),
            0.018
          ),
          segment(
            objectUV,
            vec2(
              0.57,
              0.43
            ),
            vec2(
              0.43,
              0.57
            ),
            0.018
          )
        );

      material =
        mix(
          material,
          error,
          cross
        );
    }

    // Object edge.
    float edge =
      1.0 -
      smoothstep(
        0.0,
        0.022,
        abs(
          objectDistance
        )
      );

    material +=
      edge *
      vec3(
        0.16,
        0.17,
        0.19
      );

    // --------------------------------
    // Background
    // --------------------------------

    vec3 background =
      vec3(
        0.018,
        0.021,
        0.026
      );

    float vignette =
      1.0 -
      smoothstep(
        0.25,
        0.9,
        length(
          centered
        )
      );

    background +=
      vignette *
      vec3(
        0.012,
        0.014,
        0.018
      );

    background =
      mix(
        background,
        vec3(
          0.005,
          0.006,
          0.008
        ),
        shadow * 0.32
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