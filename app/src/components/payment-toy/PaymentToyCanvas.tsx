"use client";

import { useEffect, useRef } from "react";

const vertexShaderSource = `
  attribute vec2 aPosition;

  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;

  uniform vec2 uRes;
  uniform vec2 uMouse;
  uniform float uTime;

  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;

    float mouseDistance = distance(uv, uMouse);

    float glow = 1.0 - smoothstep(
      0.0,
      0.5,
      mouseDistance
    );

    vec3 base = vec3(
      uv.x,
      uv.y,
      0.15 + 0.1 * sin(uTime)
    );

    base += glow * 0.15;

    gl_FragColor = vec4(base, 1.0);
  }
`;

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
) {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error("Failed to create shader");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader);

    gl.deleteShader(shader);

    throw new Error(
      error ?? "Shader compilation failed"
    );
  }

  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string
) {
  const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    vertexSource
  );

  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentSource
  );

  const program = gl.createProgram();

  if (!program) {
    throw new Error(
      "Failed to create WebGL program"
    );
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(program);

    gl.deleteProgram(program);

    throw new Error(
      error ?? "Program linking failed"
    );
  }

  return program;
}

export default function PaymentToyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const gl = canvas.getContext("webgl");

    if (!gl) {
      console.error("WebGL is not supported");
      return;
    }

    const program = createProgram(
      gl,
      vertexShaderSource,
      fragmentShaderSource
    );

    gl.useProgram(program);

    /*
     * Fullscreen triangle
     *
     * One triangle covers the entire viewport.
     * This avoids the extra vertex needed by a quad.
     */
    const buffer = gl.createBuffer();

    gl.bindBuffer(
      gl.ARRAY_BUFFER,
      buffer
    );

    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         3, -1,
        -1,  3,
      ]),
      gl.STATIC_DRAW
    );

    const positionLocation =
      gl.getAttribLocation(
        program,
        "aPosition"
      );

    gl.enableVertexAttribArray(
      positionLocation
    );

    gl.vertexAttribPointer(
      positionLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );

    const resolutionLocation =
      gl.getUniformLocation(
        program,
        "uRes"
      );

    const mouseLocation =
      gl.getUniformLocation(
        program,
        "uMouse"
      );

    const timeLocation =
      gl.getUniformLocation(
        program,
        "uTime"
      );

    const mouse = {
      x: 0.5,
      y: 0.5,
    };

    const handlePointerMove = (
      event: PointerEvent
    ) => {
      const rect =
        canvas.getBoundingClientRect();

      mouse.x =
        (event.clientX - rect.left) /
        rect.width;

      mouse.y =
        1 -
        (event.clientY - rect.top) /
          rect.height;
    };

    canvas.addEventListener(
      "pointermove",
      handlePointerMove
    );

    const resize = () => {
      const dpr = Math.min(
        window.devicePixelRatio,
        2
      );

      const width = Math.floor(
        canvas.clientWidth * dpr
      );

      const height = Math.floor(
        canvas.clientHeight * dpr
      );

      if (
        canvas.width !== width ||
        canvas.height !== height
      ) {
        canvas.width = width;
        canvas.height = height;

        gl.viewport(
          0,
          0,
          canvas.width,
          canvas.height
        );
      }
    };

    const startTime = performance.now();

    let animationFrame = 0;

    const render = () => {
      resize();

      const elapsed =
        (performance.now() - startTime) /
        1000;

      gl.uniform2f(
        resolutionLocation,
        canvas.width,
        canvas.height
      );

      gl.uniform2f(
        mouseLocation,
        mouse.x,
        mouse.y
      );

      gl.uniform1f(
        timeLocation,
        elapsed
      );

      gl.drawArrays(
        gl.TRIANGLES,
        0,
        3
      );

      animationFrame =
        requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(
        animationFrame
      );

      canvas.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
}