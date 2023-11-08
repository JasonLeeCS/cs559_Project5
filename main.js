// Get the canvas element and its WebGL context
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');

// Vertex shader program
const vsSource = `
    attribute vec4 aVertexPosition;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    }
`;

// Fragment shader program
const fsSource = `
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);  // white color
    }
`;

// Function to compile a shader
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    // Check if the shader compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

// Function to initialize shaders
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

// Initialize a shader program; this is where all the lighting for the vertices and so forth is established.
const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

// Collect all the info needed to use the shader program.
const programInfo = {
    program: shaderProgram,
    attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    },
    uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
};

// Function to initialize the buffers for a cube
function initBuffers(gl) {
    // Create a buffer for the cube's vertex positions.
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Create an array of positions for the cube.
    const positions = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
        
        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,
        
        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,
        
        // Bottom face
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,
        
        // Right face
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,
        
        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    
    // Set up the indices for the vertices that make up the cube's faces.
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    const indices = [
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23,   // left
    ];

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        indices: indexBuffer,
    };
}
function createPyramidGeometry(gl) {
    const pyramidVertices = [
        // Base (Y = 0)
        -0.5, 0, -0.5,   // 0: Bottom Left
         0.5, 0, -0.5,   // 1: Bottom Right
         0.5, 0,  0.5,   // 2: Top Right
        -0.5, 0,  0.5,   // 3: Top Left

        // Sides (Pyramid Point = 0, 1, 0)
        // -0.5, 0, -0.5,   // 0: Base Bottom Left
        //  0.5, 0, -0.5,   // 1: Base Bottom Right
        //  0, 1, 0,        // Pyramid Point

        //  0.5, 0, -0.5,   // 1: Base Bottom Right
        //  0.5, 0,  0.5,   // 2: Base Top Right
        //  0, 1, 0,        // Pyramid Point

        //  0.5, 0,  0.5,   // 2: Base Top Right
        // -0.5, 0,  0.5,   // 3: Base Top Left
        //  0, 1, 0,        // Pyramid Point

        // -0.5, 0,  0.5,   // 3: Base Top Left
        // -0.5, 0, -0.5,   // 0: Base Bottom Left
        //  0, 1, 0,        // Pyramid Point
    ];
    
        const pyramidBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pyramidBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pyramidVertices), gl.STATIC_DRAW);
    
        return pyramidBuffer;
}

// Initialize the buffers
const buffers = initBuffers(gl);
const pyramidBuffer = createPyramidGeometry(gl);

let rotation = 0.0;

function drawScene(gl, programInfo, buffers, pyramidBuffer, deltaTime) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.disable(gl.CULL_FACE);

    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Create a perspective matrix
    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    const radius = 10; // Distance from the object
    const cameraHeight = radius * Math.sin(Math.PI / 4); // Height of camera to achieve 45-degree angle
    const cameraDistance = radius * Math.cos(Math.PI / 4); // Distance on the ground from the object to the camera

    // Calculate the camera's orbit position
    const eyeX = cameraDistance * Math.cos(rotation);
    const eyeZ = cameraDistance * Math.sin(rotation);

    const eye = [eyeX, cameraHeight, eyeZ]; // Eye position (the position of the camera)
    const center = [0, 0, 0]; // The point we are looking at
    const up = [0, 1, 0]; // "up" direction for the camera
    const modelViewMatrix = mat4.create();
    mat4.lookAt(modelViewMatrix, eye, center, up);

    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);

    // Set the shader uniforms
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);


    // Draw Cube
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            3, // numComponents
            gl.FLOAT, // type
            false, // normalize
            0, // stride
            0); // offset
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

        // Set the shader uniforms for model-view matrix
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            modelViewMatrix);

        const vertexCount = 36; // Because each face has 2 triangles and each triangle has 3 vertices
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
    // Draw Pyramid
    {
        // Apply a transformation to position the pyramid relative to the cube
        const pyramidModelViewMatrix = mat4.create();
        mat4.translate(pyramidModelViewMatrix, modelViewMatrix, [1.5, 0.0, 0.0]); // Move to the right of the cube
        mat4.scale(pyramidModelViewMatrix, pyramidModelViewMatrix, [0.5, 0.5, 0.5]); // Scale down the pyramid

        // Set up the pyramid's vertex position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, pyramidBuffer);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

        // Update the model view matrix for the pyramid
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.modelViewMatrix,
            false,
            pyramidModelViewMatrix);

        // Draw the pyramid
        gl.drawArrays(gl.TRIANGLES, 0, 12); // 4 triangles, 3 vertices each
    }

    // Update the rotation for the next draw
    rotation += deltaTime;
    
}

function render(now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;

    drawScene(gl, programInfo, buffers, pyramidBuffer, deltaTime);

    requestAnimationFrame(render);
}

let then = 0;
requestAnimationFrame(render);
