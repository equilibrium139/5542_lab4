var gl;  // the graphics context (gc) 
var shaderProgram;  // the shader program 
//viewport info 
var vp_minX, vp_maxX, vp_minY, vp_maxY, vp_width, vp_height; 

function Node(color, local_position, local_rotation, scale, parent = null, rotation_origin = [0,0])
{
    this.local_matrix = mat4.create();
    this.local_matrix = mat4.identity(this.local_matrix);
    this.local_matrix = mat4.translate(this.local_matrix, [local_position[0], local_position[1], 0]);
    this.local_matrix = mat4.translate(this.local_matrix, [rotation_origin[0], rotation_origin[1], 0]);
    this.local_matrix = mat4.rotate(this.local_matrix, DegToRad(local_rotation), [0, 0, 1]);
    this.local_matrix = mat4.translate(this.local_matrix, [-rotation_origin[0], -rotation_origin[1], 0]);
    this.local_scale = scale; // don't apply scale to localTransform so that children aren't affected by it
    this.color = color;
    this.children = [];

    if (parent)
    {
        parent.addChild(this);
    }

    this.translate = function(translation) 
    {
        this.local_matrix = mat4.translate(this.local_matrix, translation);
    }

    this.rotate = function(rotation) 
    { 
        this.local_matrix = mat4.translate(this.local_matrix, [rotation_origin[0], rotation_origin[1], 0]);
        this.local_matrix = mat4.rotate(this.local_matrix, DegToRad(rotation), [0, 0, 1]);
        this.local_matrix = mat4.translate(this.local_matrix, [-rotation_origin[0], -rotation_origin[1], 0]);
    }

    this.scale = function(s)
    {
        this.local_scale[0] *= s[0];
        this.local_scale[1] *= s[1];
    }

    this.addChild = function(child)
    {
        this.children.push(child);
    }
}

var red = [1, 0, 0];
var green = [0, 1, 0];
var blue = [0, 0, 1];

var person_root = new Node(null, [0, 0], 0, [1, 1]);
var torso = new Node(red, [0, 0], 0, [0.05, 0.7], person_root);
var shoulder = new Node(green, [0, 0.35], 0, [0.3, 0.05], torso);
var neck = new Node(blue, [0, 0.075], 0, [0.05, 0.1], shoulder, [0, -0.05]);
var head = new Node(red, [0, 0.13], 0, [0.25, 0.25], neck);
var hip = new Node(green, [0, -0.35], 0, [0.3, 0.1], torso);
var left_upper_leg = new Node(blue, [-0.15, -0.175], 0, [0.05, 0.3], hip, [0, 0.15]);
var left_lower_leg = new Node(red, [0, -0.3], 0, [0.05, 0.3], left_upper_leg, [0, 0.15]);
var right_upper_leg = new Node(red, [0.15, -0.175], 0, [0.05, 0.3], hip, [0, 0.15]);
var right_lower_leg = new Node(blue, [0, -0.3], 0, [0.05, 0.3], right_upper_leg, [0, 0.15]);
var left_upper_arm = new Node(red, [-0.15, -0.125], 0, [0.05, 0.2], shoulder, [0, 0.1]);
var left_lower_arm = new Node(green, [0, -.1625], 0, [0.05, 0.2], left_upper_arm, [0, 0.1]);
var right_upper_arm = new Node(blue, [0.15, -0.125], 0, [0.05, 0.2], shoulder, [0, 0.1]);
var right_lower_arm = new Node(red, [0, -.1625], 0, [0.05, 0.2], right_upper_arm, [0, 0.1]);

var quad_vbo;
var axes_vbo;

var SOLID = 0;
var LINE = 1;
var POINT = 2;
var draw_mode = SOLID;

var draw_axes = true;

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
    var canvas = document.getElementById("lab1-canvas");
    initGL(canvas);
    initShaders();
    ////////
    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    ////////
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.colorUniform = gl.getUniformLocation(shaderProgram, "uColor");
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    initScene();
    
    document.addEventListener('keydown', onKeyDown, false);
}

function CreateBuffers()
{
    var quad_vertices =
    [
        0.5,  0.5,  0.0, // TR
       -0.5,  0.5,  0.0, // TL
       -0.5, -0.5,  0.0, // BL
        0.5, -0.5,  0.0, // BR
    ];
    quad_vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad_vertices), gl.STATIC_DRAW);

    var axes_vertices =
    [
        0.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        0.0, 0.0, 0.0,
        0.0, 1.0, 0.0
    ];
    axes_vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, axes_vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(axes_vertices), gl.STATIC_DRAW);
}

function initScene() {
    vp_minX = 0; vp_maxX = gl.canvasWidth;  vp_width = vp_maxX- vp_minX+1; 
    vp_minY = 0; vp_maxY = gl.canvasHeight; vp_height = vp_maxY-vp_minY+1; 
    console.log(vp_minX, vp_maxX, vp_minY, vp_maxY); 
    gl.viewport(vp_minX, vp_minY, vp_width, vp_height); 
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    CreateBuffers(); 
    drawScene();
}

function DegToRad(deg)
{
    return (3.14 / 180) * deg;
}

function DrawAxes(matrix)
{
    gl.bindBuffer(gl.ARRAY_BUFFER, axes_vbo);
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, matrix);
    gl.uniform3f(shaderProgram.colorUniform, 1, 0, 1);
    gl.drawArrays(gl.LINES, 0, 2);
    gl.uniform3f(shaderProgram.colorUniform, 0, 1, 1);
    gl.drawArrays(gl.LINES, 2, 2);
}

function DrawQuad(matrix, color)
{
    gl.bindBuffer(gl.ARRAY_BUFFER, quad_vbo);
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, matrix);
    gl.uniform3f(shaderProgram.colorUniform, color[0], color[1], color[2]);
    if (draw_mode == SOLID)
    {
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
    else if (draw_mode == LINE)
    {
        gl.drawArrays(gl.LINE_LOOP, 0, 4);
    }
    else if (draw_mode == POINT)
    {
        gl.drawArrays(gl.POINTS, 0, 4);
    }
}

function DrawNode(node, parentWorldMatrix)
{
    var nodeLocalMatrixWithScaling = mat4.create();
    mat4.scale(node.local_matrix, [node.local_scale[0], node.local_scale[1], 1], nodeLocalMatrixWithScaling);
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

    DrawQuad(nodeWorldMatrixWithScaling, node.color);
    if (draw_axes) DrawAxes(nodeWorldMatrixWithScaling);

    for (const child of node.children) 
    {
        DrawNode(child, nodeWorldMatrix);
    }
}

function DrawPerson()
{
    // Only top-level scale affects child nodes
    var person_matrix = mat4.create();
    mat4.scale(person_root.local_matrix, [person_root.local_scale[0], person_root.local_scale[1], 1], person_matrix);
    for (const child of person_root.children)
    {
        DrawNode(child, person_matrix);
    }
}

function drawScene()
{
    vp_minX = 0; vp_maxX = gl.canvasWidth - 1; vp_width = vp_maxX - vp_minX + 1;
    vp_minY = 0; vp_maxY = gl.canvasHeight - 1; vp_height = vp_maxY - vp_minY + 1;
    gl.viewport(vp_minX, vp_minY, vp_width, vp_height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    DrawPerson();
}

function onKeyDown(event) {
    switch (event.keyCode) {
        case 87: // w
            person_root.translate([0, 0.1, 0]);
            break;
        case 65: // a
            person_root.translate([-0.1, 0, 0]);
            break;
        case 83: // s
            person_root.translate([0, -0.1, 0]);
            break;
        case 68: // d
            person_root.translate([0.1, 0, 0]);
            break;
        case 82: // r
            person_root.rotate(20);
            break;
        case 69: // e
            if (event.shiftKey) person_root.scale([1.1, 1.1]);
            else person_root.scale([0.9, 0.9]);
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
    }
    drawScene();
}