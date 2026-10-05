// background.js - WebGL Fluid Gradient Shader Background

document.addEventListener('DOMContentLoaded', () => {
    initWebGLBackground();
});

function initWebGLBackground() {
    const canvas = document.getElementById('webgl-bg-canvas');
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
        console.warn('WebGL not supported by this browser. Falling back to CSS backgrounds.');
        return;
    }

    // Vertex Shader: Maps canvas coordinates to clip space
    const vsSource = `
        attribute vec2 position;
        void main() {
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;

    // Fragment Shader: Renders fluid morphing patterns in blue, teal and white
    const fsSource = `
        precision mediump float;
        uniform vec2 u_resolution;
        uniform float u_time;

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            
            // Generate fluid wave offsets
            float wave1 = sin(uv.x * 3.5 + u_time * 0.4) * 0.45;
            float wave2 = cos(uv.y * 3.0 - u_time * 0.3) * 0.45;
            float wave3 = sin((uv.x + uv.y) * 4.0 + u_time * 0.5) * 0.35;
            
            float blend = uv.y + wave1 + wave2 + wave3;
            
            // Define modern light color variables
            vec3 bgColor = vec3(0.97, 0.98, 0.99); // #F8FAFC
            vec3 blueColor = vec3(0.145, 0.388, 0.925); // #2563EB
            vec3 tealColor = vec3(0.078, 0.722, 0.651); // #14B8A6
            vec3 whiteBlend = vec3(1.0, 1.0, 1.0);

            // Interpolate colors based on wave blends
            vec3 finalColor = bgColor;
            
            if (blend < 0.25) {
                finalColor = mix(bgColor, whiteBlend, blend * 4.0);
            } else if (blend < 0.55) {
                float t = (blend - 0.25) / 0.3;
                finalColor = mix(whiteBlend, tealColor, t * 0.08); // Subtle touch of teal
            } else if (blend < 0.85) {
                float t = (blend - 0.55) / 0.3;
                finalColor = mix(finalColor, blueColor, t * 0.05); // Subtle touch of blue
            } else {
                finalColor = mix(finalColor, bgColor, 0.1);
            }

            // Keep it extremely soft and corporate (opacity control)
            gl_FragColor = vec4(mix(bgColor, finalColor, 0.45), 1.0);
        }
    `;

    // Compile Shader Function
    function compileShader(source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const vertexShader = compileShader(vsSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fsSource, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;

    // Create Program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Shader program linking error:', gl.getProgramInfoLog(program));
        return;
    }

    gl.useProgram(program);

    // Setup Buffer (Full screen quad)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const vertices = new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Bind attribute
    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Get Uniforms
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeLocation = gl.getUniformLocation(program, 'u_time');

    // Resize Handler
    function resizeCanvas() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        }
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Render loop
    function render(time) {
        // Convert milliseconds to seconds
        const timeSecs = time * 0.001;

        // Set Uniforms
        gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
        gl.uniform1f(timeLocation, timeSecs);

        // Draw
        gl.clearColor(0.97, 0.98, 0.99, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}
