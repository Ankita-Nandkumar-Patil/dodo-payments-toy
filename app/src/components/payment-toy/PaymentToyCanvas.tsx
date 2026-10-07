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

  // Once linked into the program, these shader objects
  // are no longer needed directly.
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
    // Uniform locations
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

    const chargeLocation =
      gl.getUniformLocation(
        program,
        "uCharge"
      );

    // --------------------------------
    // Runtime values
    // --------------------------------

    const mouse = {
      x: 0.5,
      y: 0.5,
    };

    let method = 0;

    const chargeRef = {
      current: 0,
    };

    const isHoldingRef = {
      current: false,
    };

    let chargeAnimationFrame = 0;

    // --------------------------------
    // Mouse / touch position
    // --------------------------------

    const updatePointerPosition = (
      event: PointerEvent
    ) => {
      const rect =
        canvas.getBoundingClientRect();

      if (
        rect.width === 0 ||
        rect.height === 0
      ) {
        return;
      }

      mouse.x = Math.max(
        0,
        Math.min(
          1,
          (event.clientX - rect.left) /
            rect.width
        )
      );

      mouse.y = Math.max(
        0,
        Math.min(
          1,
          1 -
            (event.clientY - rect.top) /
              rect.height
        )
      );
    };

    const handlePointerMove = (
      event: PointerEvent
    ) => {
      updatePointerPosition(event);
    };

    // --------------------------------
    // Start charging
    // --------------------------------

    const startCharging = (
      event?: PointerEvent
    ) => {
      if (isHoldingRef.current) {
        return;
      }

      if (event) {
        updatePointerPosition(event);

        // Keep receiving pointerup even if
        // the pointer leaves the canvas.
        canvas.setPointerCapture(
          event.pointerId
        );
      }

      isHoldingRef.current = true;

      cancelAnimationFrame(
        chargeAnimationFrame
      );

      const startCharge =
        chargeRef.current;

      const startTime =
        performance.now();

      const chargeDuration = 1200;

      const animateCharge = () => {
        if (!isHoldingRef.current) {
          return;
        }

        const elapsed =
          performance.now() -
          startTime;

        const progress = Math.min(
          elapsed / chargeDuration,
          1
        );

        // Ease-in.
        const eased =
          progress * progress;

        chargeRef.current =
          startCharge +
          (1 - startCharge) *
            eased;

        if (progress < 1) {
          chargeAnimationFrame =
            requestAnimationFrame(
              animateCharge
            );
        } else {
          chargeRef.current = 1;
        }
      };

      chargeAnimationFrame =
        requestAnimationFrame(
          animateCharge
        );
    };

    // --------------------------------
    // Spring back
    // --------------------------------

    const releaseCharging = (
      event?: PointerEvent
    ) => {
      if (!isHoldingRef.current) {
        return;
      }

      isHoldingRef.current = false;

      if (
        event &&
        canvas.hasPointerCapture(
          event.pointerId
        )
      ) {
        canvas.releasePointerCapture(
          event.pointerId
        );
      }

      cancelAnimationFrame(
        chargeAnimationFrame
      );

      const startCharge =
        chargeRef.current;

      const startTime =
        performance.now();

      const springDuration = 500;

      const animateSpring = () => {
        const elapsed =
          performance.now() -
          startTime;

        const progress = Math.min(
          elapsed / springDuration,
          1
        );

        // Smooth ease-out.
        const eased =
          1 -
          Math.pow(
            1 - progress,
            3
          );

        chargeRef.current =
          startCharge *
          (1 - eased);

        if (progress < 1) {
          chargeAnimationFrame =
            requestAnimationFrame(
              animateSpring
            );
        } else {
          chargeRef.current = 0;
        }
      };

      chargeAnimationFrame =
        requestAnimationFrame(
          animateSpring
        );
    };

    // --------------------------------
    // Pointer interaction
    // --------------------------------

    const handlePointerDown = (
      event: PointerEvent
    ) => {
      // Only react to primary pointer.
      if (!event.isPrimary) {
        return;
      }

      startCharging(event);
    };

    const handlePointerUp = (
      event: PointerEvent
    ) => {
      if (!event.isPrimary) {
        return;
      }

      releaseCharging(event);
    };

    const handlePointerCancel = (
      event: PointerEvent
    ) => {
      if (!event.isPrimary) {
        return;
      }

      releaseCharging(event);
    };

    canvas.addEventListener(
      "pointermove",
      handlePointerMove
    );

    canvas.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    canvas.addEventListener(
      "pointerup",
      handlePointerUp
    );

    canvas.addEventListener(
      "pointercancel",
      handlePointerCancel
    );

    // --------------------------------
    // Development keyboard controls
    // --------------------------------

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === "1" ||
        event.key === "2" ||
        event.key === "3"
      ) {
        method =
          Number(event.key) - 1;
      }

      if (
        event.key === " " ||
        event.key === "Enter"
      ) {
        event.preventDefault();

        if (!isHoldingRef.current) {
          startCharging();
        }
      }
    };

    const handleKeyUp = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === " " ||
        event.key === "Enter"
      ) {
        event.preventDefault();

        releaseCharging();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    window.addEventListener(
      "keyup",
      handleKeyUp
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

    const startTime =
      performance.now();

    const render = () => {
      resize();

      const elapsed =
        (performance.now() -
          startTime) /
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

      if (chargeLocation) {
        gl.uniform1f(
          chargeLocation,
          chargeRef.current
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

      cancelAnimationFrame(
        chargeAnimationFrame
      );

      canvas.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      canvas.removeEventListener(
        "pointerdown",
        handlePointerDown
      );

      canvas.removeEventListener(
        "pointerup",
        handlePointerUp
      );

      canvas.removeEventListener(
        "pointercancel",
        handlePointerCancel
      );

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      window.removeEventListener(
        "keyup",
        handleKeyUp
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
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    />
  );
}