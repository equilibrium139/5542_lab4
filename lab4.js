var gl;  // the graphics context (gc) 
var shaderProgram;  // the shader program 
//viewport info 
var vp_minX, vp_maxX, vp_minY, vp_maxY, vp_width, vp_height;

// return vertices and indices needed to render unit sphere
function UnitSphereData(num_latitude_lines = 64, num_longitude_lines = 64) {
    var vertices = [0, 1, 0];

    const latitude_delta = DegToRad(180 / (num_latitude_lines + 1));
    var latitude_angle = latitude_delta;
    const longitude_delta = DegToRad(360 / (num_longitude_lines));

    for (var latitude_level = 0; latitude_level < num_latitude_lines; latitude_level++) {
        var sin_latitude = Math.sin(latitude_angle);
        var cos_latitude = Math.cos(latitude_angle);
        var longitude_angle = 0;
        var y = cos_latitude;
        for (var longitude_level = 0; longitude_level < num_longitude_lines; longitude_level++) {
            var x = sin_latitude * Math.cos(longitude_angle);
            var z = sin_latitude * Math.sin(longitude_angle);
            vertices.push(x, y, z);
            longitude_angle += longitude_delta;
        }
        latitude_angle += latitude_delta;
    }

    vertices.push(0, -1, 0);

    var indices = [];
    // Connect first latitude level with top of sphere
    var first_level_begin = 1;
    var first_level_end = first_level_begin + num_longitude_lines - 1;
    for (var latitude_level = 0; latitude_level < num_longitude_lines - 1; latitude_level++) {
        indices.push(0, first_level_begin + latitude_level, first_level_begin + latitude_level + 1);
    }
    indices.push(0, first_level_end, first_level_begin);

    // Connect latitude levels with each other
    for (var latitude_level = 0; latitude_level < num_latitude_lines - 1; latitude_level++) {
        var latitude_level_begin = 1 + latitude_level * num_longitude_lines;
        var next_latitude_level_begin = latitude_level_begin + num_longitude_lines;

        for (var longitude_level = 0; longitude_level < num_longitude_lines - 1; longitude_level++) {
            var top_left_index = latitude_level_begin + longitude_level;
            var top_right_index = top_left_index + 1;
            var bottom_left_index = next_latitude_level_begin + longitude_level;
            var bottom_right_index = bottom_left_index + 1;
            indices.push(top_left_index, bottom_left_index, top_right_index,
                bottom_left_index, bottom_right_index, top_right_index);
        }

        // Add quad to connect last point to first point
        var top_left_index = latitude_level_begin + num_longitude_lines - 1;
        var top_right_index = latitude_level_begin;
        var bottom_left_index = next_latitude_level_begin + num_longitude_lines - 1;
        var bottom_right_index = next_latitude_level_begin;
        indices.push(top_left_index, bottom_left_index, top_right_index,
            bottom_left_index, bottom_right_index, top_right_index);
    }

    // Connect last latitude level with bottom of sphere
    var last_level_begin = 1 + (num_latitude_lines - 1) * num_longitude_lines;
    var last_level_end = last_level_begin + num_longitude_lines - 1;
    for (var latitude_level = 0; latitude_level < num_longitude_lines - 1; latitude_level++) {
        indices.push(vertices.length - 1, last_level_begin + latitude_level, last_level_begin + latitude_level + 1);
    }
    indices.push(vertices.length - 1, last_level_begin, last_level_end);

    return [vertices, indices];
}

function CylinderData(samples = 30)
{
    var vertices = [0, 0.5, 0];
    
    var angle = 0;
    var delta_angle = DegToRad(360 / (samples + 1));

    for (var i = 0; i < samples; i++)
    {
        var x = 0.5 * Math.cos(angle);
        var z = 0.5 * Math.sin(angle);
        vertices.push(x, 0.5, z, x, -0.5, z);
        angle += delta_angle;
    }

    vertices.push(0, -0.5, 0);

    var indices = [];

    // Top circle
    var top_circle_begin = 1;
    var increment = 2;
    var top_circle_end = top_circle_begin + increment * (samples - 1); 
    for (var i = 0; i < samples - 1; i++)
    {
        indices.push(0, top_circle_begin + i * increment, top_circle_begin + (i + 1) * increment);
    }
    indices.push(0, top_circle_end, top_circle_begin);

    // Body
    var bottom_circle_begin = 2;
    var bottom_circle_end = bottom_circle_begin + increment * (samples - 1);
    for (var i = 0; i < samples - 1; i++)
    {
        var top_left = top_circle_begin + i * increment;
        var top_right = top_left + increment;
        var bottom_left = bottom_circle_begin + i * increment;
        var bottom_right = bottom_left + increment;
        indices.push(top_left, bottom_left, top_right,
                     top_right, bottom_left, bottom_right);
                    
    }
    // Connect last point to first point
    indices.push(top_circle_end, bottom_circle_end, top_circle_begin,
                 top_circle_begin, bottom_circle_end, bottom_circle_begin);

    // Bottom cirlce
    for (var i = 0; i < samples - 1; i++) {
        indices.push(vertices.length - 1, bottom_circle_begin + i * increment, bottom_circle_begin + (i + 1) * increment);
    }
    indices.push(vertices.length - 1, bottom_circle_end, bottom_circle_begin);

    return [vertices, indices];
}

function ConeData(samples = 30)
{
    vertices = [0, 0.5, 0];

    var angle = 0;
    var delta_angle = DegToRad(360 / (samples + 1));
    var y = -0.5;
    var radius = 0.5;

    for (var i = 0; i < samples; i++)
    {
        var x = radius * Math.cos(angle);
        var z = radius * Math.sin(angle);
        vertices.push(x, y, z);
        angle += delta_angle;
    }

    vertices.push(0, -0.5, 0);

    indices = [];

    // Connect top point to circle points
    var circle_start = 1;
    for (var i = 0; i < samples - 1; i++)
    {
        indices.push(0, circle_start + i, circle_start + i + 1);
    }
    var circle_end = circle_start + samples - 1;
    indices.push(0, circle_end, circle_start);

    // Create circle
    for (var i = 0; i < samples - 1; i++)
    {
        indices.push(vertices.length - 1, circle_start + i, circle_start + i + 1);
    }
    indices.push(vertices.length - 1, circle_end, circle_start);

    return [vertices, indices];
}

var camera_position = [0, 0, 5];
var camera_forward = [0, 0, -1];
var world_up = [0, 1, 0];

var fov = 60.0;
var aspect_ratio = 1.0;
var near = 0.1;
var far = 100.0;
var rotation = 0;

var sphere_vbo;
var sphere_ebo;
var num_sphere_indices;

function ViewMatrix() {
    var view = mat4.create();
    return mat4.lookAt(camera_position, camera_forward, world_up, view);
}

function ProjMatrix() {
    var proj = mat4.create();
    return mat4.perspective(fov, aspect_ratio, near, far, proj);
}

var red = [1, 0, 0];
var green = [0, 1, 0];
var blue = [0, 0, 1];

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
    // Hide cursor
    document.addEventListener("click", function () {
        document.body.requestPointerLock();
    });
    
    function logMovement(event) {
        console.log(`movement: ${event.movementX}, ${event.movementY}`);
    }

    document.addEventListener('mousemove', logMovement);

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

    initScene();

    document.addEventListener('keydown', onKeyDown, false);
}

function CreateBuffers() {
    var sphere_data = ConeData();
    num_sphere_indices = sphere_data[1].length;

    sphere_vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphere_vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere_data[0]), gl.STATIC_DRAW);

    sphere_ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere_ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sphere_data[1]), gl.STATIC_DRAW);

    var axes_vertices =
    [
        0.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        0.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.0, 0.0,
        0.0, 0.0, 1.0
    ];
    axes_vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, axes_vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(axes_vertices), gl.STATIC_DRAW);
}

function initScene() {
    vp_minX = 0; vp_maxX = gl.canvasWidth; vp_width = vp_maxX - vp_minX + 1;
    vp_minY = 0; vp_maxY = gl.canvasHeight; vp_height = vp_maxY - vp_minY + 1;
    console.log(vp_minX, vp_maxX, vp_minY, vp_maxY);
    gl.viewport(vp_minX, vp_minY, vp_width, vp_height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    CreateBuffers();
    drawScene();
}

function DegToRad(deg) {
    return (3.14 / 180) * deg;
}

function DrawAxes(matrix) {
    gl.bindBuffer(gl.ARRAY_BUFFER, axes_vbo);
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    var viewMat = ViewMatrix();
    var proj = ProjMatrix();
    var mv = mat4.multiply(viewMat, matrix, mv);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mv);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, proj);
    gl.uniform3f(shaderProgram.colorUniform, 0, 1, 0);
    gl.drawArrays(gl.LINES, 0, 2);
    gl.uniform3f(shaderProgram.colorUniform, 0, 1, 1);
    gl.drawArrays(gl.LINES, 2, 2);
}

function DrawSphere() {
    var model = mat4.create();
    mat4.identity(model);
    model = mat4.rotate(model, DegToRad(rotation), [1, 0, 0]);
    var view = ViewMatrix();
    var proj = ProjMatrix();

    var modelView = mat4.create();
    mat4.multiply(view, model, modelView);

    gl.bindBuffer(gl.ARRAY_BUFFER, sphere_vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphere_ebo);
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, modelView);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, proj);
    gl.uniform3f(shaderProgram.colorUniform, 1, 0, 0);
    gl.drawElements(gl.TRIANGLES, num_sphere_indices, gl.UNSIGNED_SHORT, 0);

    DrawAxes(model);
}

function drawScene() {
    vp_minX = 0; vp_maxX = gl.canvasWidth - 1; vp_width = vp_maxX - vp_minX + 1;
    vp_minY = 0; vp_maxY = gl.canvasHeight - 1; vp_height = vp_maxY - vp_minY + 1;
    gl.viewport(vp_minX, vp_minY, vp_width, vp_height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    DrawSphere();
}

function onKeyDown(event) {
    switch (event.keyCode) {
        case 82: // r
            if (event.shiftKey) rotation -= 1;
            else rotation += 1;
            break;
    }
    drawScene();
}