"use client";

import { useEffect, useRef } from "react";

import {
  vertexShaderSource,
  fragmentShaderSource,
} from "./paymentToy.shader";

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader {
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
      `Shader compilation failed:\n${error ?? "Unknown error"}`
    );
  }

  return shader;
}

function createProgram(
  gl: WebGLRenderingContext
): WebGLProgram {
  const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderSource
  );

  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );

  const program = gl.createProgram();

  if (!program) {
    throw new Error("Failed to create WebGL program");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(program);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    gl.deleteProgram(program);

    throw new Error(
      `Program linking failed:\n${error ?? "Unknown error"}`
    );
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

export default function PaymentToyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const gl = canvas.getContext("webgl", {
      antialias: true,
      alpha: false,
    });

    if (!gl) {
      console.error("WebGL is not supported.");
      return;
    }

    let program: WebGLProgram;

    try {
      program = createProgram(gl);
    } catch (error) {
      console.error(error);
      return;
    }

    gl.useProgram(program);

    // --------------------------------
    // Fullscreen triangle
    // --------------------------------

    const buffer = gl.createBuffer();

    if (!buffer) {
      console.error("Failed to create WebGL buffer.");
      gl.deleteProgram(program);
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

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

    if (positionLocation === -1) {
      console.error(
        "Could not find aPosition attribute."
      );

      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);

      return;
    }

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

    // --------------------------------
    // Uniforms
    // --------------------------------

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

    const methodLocation =
      gl.getUniformLocation(
        program,
        "uMethod"
      );

    // --------------------------------
    // Runtime values
    // --------------------------------

    const mouse = {
      x: 0.5,
      y: 0.5,
    };

    let method = 0;

    // --------------------------------
    // Pointer
    // --------------------------------

    const handlePointerMove = (
      event: PointerEvent
    ) => {
      const rect =
        canvas.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) {
        return;
      }

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

    // --------------------------------
    // Development keyboard controls
    // --------------------------------

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "1") {
        method = 0;
      }

      if (event.key === "2") {
        method = 1;
      }

      if (event.key === "3") {
        method = 2;
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    // --------------------------------
    // Resize
    // --------------------------------

    const resize = () => {
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        2
      );

      const width = Math.max(
        1,
        Math.floor(
          canvas.clientWidth * dpr
        )
      );

      const height = Math.max(
        1,
        Math.floor(
          canvas.clientHeight * dpr
        )
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
          width,
          height
        );
      }
    };

    // --------------------------------
    // Render loop
    // --------------------------------

    let animationFrameId = 0;
    const startTime = performance.now();

    const render = () => {
      resize();

      const elapsed =
        (performance.now() - startTime) /
        1000;

      gl.useProgram(program);

      if (resolutionLocation) {
        gl.uniform2f(
          resolutionLocation,
          canvas.width,
          canvas.height
        );
      }

      if (mouseLocation) {
        gl.uniform2f(
          mouseLocation,
          mouse.x,
          mouse.y
        );
      }

      if (timeLocation) {
        gl.uniform1f(
          timeLocation,
          elapsed
        );
      }

      if (methodLocation) {
        gl.uniform1f(
          methodLocation,
          method
        );
      }

      gl.drawArrays(
        gl.TRIANGLES,
        0,
        3
      );

      animationFrameId =
        requestAnimationFrame(render);
    };

    resize();
    render();

    // --------------------------------
    // Cleanup
    // --------------------------------

    return () => {
      cancelAnimationFrame(
        animationFrameId
      );

      canvas.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
      }}
    />
  );
}