var gl;  // the graphics context (gc) 
var shaderProgram;  // the shader program 
//viewport info 
var vp_minX, vp_maxX, vp_minY, vp_maxY, vp_width, vp_height;

var camera = new Camera([0, 0, -5], [0, 1, 0]);

var fov = 60.0;
var aspect_ratio = 1.0;
var near = 0.1;
var far = 100.0;
var rotation = 0;

var previous_frame_time = 0;
var delta_time = 0;

var current_buffers;
var sphere_buffers;
var cylinder_buffers;
var cone_buffers;
var tetra_buffers;
var cube_buffers;

var pressed={};

var red = [1, 0, 0];
var green = [0, 1, 0];
var blue = [0, 0, 1];


var person_root = new Node(null, null, [0, 0], 0, [1, 1, 1]);
var torso;
var neck;
var head;
var left_upper_arm; 
var left_lower_arm;
var right_upper_arm;
var right_lower_arm;
var left_upper_leg;
var left_lower_leg;
var right_upper_leg;
var right_lower_leg;

function ProjMatrix() {
    var proj = mat4.create();
    return mat4.perspective(fov, aspect_ratio, near, far, proj);
}

function CreatePerson()
{
    torso = new Node(red, cube_buffers, [0, 0], 0, [0.5, 1, 0.5], person_root);
    neck = new Node(blue, cube_buffers, [0, 0.65], 0, [0.25, 0.3, 0.25], torso, [0, -0.15]);
    head = new Node(green, sphere_buffers, [0, 0.275], 0, [0.25, 0.25, 0.25], neck);
    left_upper_arm = new Node(blue, cube_buffers, [-0.5, 0.45], 0, [0.5, 0.1, 0.1], torso, [0.25, 0]);
    left_lower_arm = new Node(red, cube_buffers, [-0.5, 0], 0, [0.5, 0.1, 0.1], left_upper_arm, [0.25, 0]);
    right_upper_arm = new Node(blue, cube_buffers, [0.5, 0.45], 0, [0.5, 0.1, 0.1], torso, [-.25, 0]);
    right_lower_arm = new Node(red, cube_buffers, [0.5, 0], 0, [0.5, 0.1, 0.1], right_upper_arm, [-0.25, 0]);
    left_upper_leg = new Node(blue, cube_buffers, [-0.2, -0.75], 0, [0.1, 0.5, 0.1], torso, [0, 0.25]);
    left_lower_leg = new Node(green, cube_buffers, [0, -0.5], 0, [0.1, 0.5, 0.1], left_upper_leg, [0, 0.25]);
    right_upper_leg = new Node(blue, cube_buffers, [0.2, -0.75], 0, [0.1, 0.5, 0.1], torso, [0, 0.25]);
    right_lower_leg = new Node(green, cube_buffers, [0, -0.5], 0, [0.1, 0.5, 0.1], right_upper_leg, [0, 0.25]);    
}

function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.canvasWidth = canvas.width;
        gl.canvasHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

function webGLStart() {
    // Hide cursor
    document.addEventListener("click", function () {
        document.body.requestPointerLock();
    });

    var canvas = document.getElementById("lab1-canvas");
    initGL(canvas);
    initShaders();
    ////////
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    ////////
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.colorUniform = gl.getUniformLocation(shaderProgram, "uColor");

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    initScene();

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);

    window.requestAnimationFrame(loop);
}

function CreateBuffers() {
    sphere_buffers = UnitSphereBuffers();
    cylinder_buffers = CylinderBuffers();
    cone_buffers = ConeBuffers();
    tetra_buffers = TetrahedronBuffers();
    cube_buffers = CubeBuffers();
}

function initScene() {
    vp_minX = 0; vp_maxX = gl.canvasWidth; vp_width = vp_maxX - vp_minX + 1;
    vp_minY = 0; vp_maxY = gl.canvasHeight; vp_height = vp_maxY - vp_minY + 1;
    console.log(vp_minX, vp_maxX, vp_minY, vp_maxY);
    gl.viewport(vp_minX, vp_minY, vp_width, vp_height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    CreateBuffers();
    current_buffers = null;
    CreatePerson();
}

function DegToRad(deg) {
    return (3.14 / 180) * deg;
}

function DrawShape(shape_buffers, model, color) {
    var view = camera.GetViewMatrix();
    var proj = ProjMatrix();

    var modelView = mat4.create();
    mat4.multiply(view, model, modelView);

    gl.bindBuffer(gl.ARRAY_BUFFER, shape_buffers.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape_buffers.ebo);
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, modelView);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, proj);
    gl.uniform3f(shaderProgram.colorUniform, color[0], color[1], color[2]);
    gl.drawElements(gl.TRIANGLES, shape_buffers.num_indices, gl.UNSIGNED_SHORT, 0);
}

function processInput()
{
    if (pressed['W']) camera.ProcessMoveCommand(FORWARD);
    if (pressed['S']) camera.ProcessMoveCommand(BACK);
    if (pressed['A']) camera.ProcessMoveCommand(LEFT);
    if (pressed['D']) camera.ProcessMoveCommand(RIGHT);
}

function loop(current_time)
{
    processInput();
    drawScene();
    window.requestAnimationFrame(loop);
}

function resetScene(new_buffers) {
    current_buffers = new_buffers;
    camera = new Camera([0, 0, -5], [0, 1, 0]);
}

function DrawNode(node, parentWorldMatrix)
{
    var nodeLocalMatrixWithScaling = mat4.create();
    mat4.scale(node.local_matrix, node.local_scale, nodeLocalMatrixWithScaling);
    var nodeWorldMatrixWithScaling;

    var nodeWorldMatrix = mat4.create();

    if (parentWorldMatrix)
    {
        nodeWorldMatrixWithScaling = mat4.create();
        mat4.multiply(parentWorldMatrix, nodeLocalMatrixWithScaling, nodeWorldMatrixWithScaling);
        mat4.multiply(parentWorldMatrix, node.local_matrix, nodeWorldMatrix);
    }
    else 
    {
        // The localMatrix is the world matrix since node doesn't have a parent
        nodeWorldMatrixWithScaling = nodeLocalMatrixWithScaling;
        // Set world matrix to original matrix without scaling
        mat4.set(node.local_matrix, nodeWorldMatrix);
    }

    DrawShape(node.shape_buffers, nodeWorldMatrixWithScaling, node.color);

    for (const child of node.children) 
    {
        DrawNode(child, nodeWorldMatrix);
    }
}

function DrawPerson()
{
    // Only top-level scale affects child nodes
    var person_matrix = mat4.create();
    mat4.scale(person_root.local_matrix, person_root.local_scale, person_matrix);
    for (const child of person_root.children)
    {
        DrawNode(child, person_matrix);
    }
}

function drawScene() {
    vp_minX = 0; vp_maxX = gl.canvasWidth - 1; vp_width = vp_maxX - vp_minX + 1;
    vp_minY = 0; vp_maxY = gl.canvasHeight - 1; vp_height = vp_maxY - vp_minY + 1;
    gl.viewport(vp_minX, vp_minY, vp_width, vp_height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (current_buffers != null)
    {
        var mat = mat4.create();
        mat = mat4.identity(mat);    
        DrawShape(current_buffers, mat, [1, 0, 0]);
    }
    else 
    {
        DrawPerson();
    }
}

function onKeyDown(event) {
    switch (event.keyCode) {
        case 82: // R
            if (event.shiftKey) person_root.rotate(-20);
            else person_root.rotate(20);
        break;
        case 69: // E
            if (event.shiftKey) person_root.scale([0.9, 0.9, 0.9]);
            else person_root.scale([1.1, 1.1, 1.1]);
        break;
        case 49: // 1
            neck.rotate(20);
        break; 
        case 50:
            left_upper_arm.rotate(20);
            break;
        case 51:
            left_lower_arm.rotate(20);
            break;
        case 52:
            right_upper_arm.rotate(20);
            break;
        case 53:
            right_lower_arm.rotate(20);
            break;
        case 54:
            left_upper_leg.rotate(20);
            break;
        case 55:
            left_lower_leg.rotate(20);
            break;
        case 56:
            right_upper_leg.rotate(20);
            break;
        case 57:
            right_lower_leg.rotate(20);
            break;
        case 87: // W
            pressed['W'] = true;
        break;
        case 83: // S
            pressed['S'] = true;
        break;
        case 65: // A
            pressed['A'] = true;
        break;
        case 68:
            pressed['D'] = true;
        break;
    }
}

function onKeyUp(event) {
    switch (event.keyCode) {
        case 87: // W
            pressed['W'] = false;
            break;
        case 83: // S
            pressed['S'] = false;
            break;
        case 65: // A
            pressed['A'] = false;
            break;
        case 68:
            pressed['D'] = false;
            break;
    }
}