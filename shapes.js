function ShapeBuffers(vertices, indices)
{
    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    this.ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    this.num_indices = indices.length;
}

// return vertices and indices needed to render unit sphere
function UnitSphereBuffers(num_latitude_lines = 64, num_longitude_lines = 64) {
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

    return new ShapeBuffers(vertices, indices);
}

function CylinderBuffers(samples = 30)
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

    return new ShapeBuffers(vertices, indices);
}

function ConeBuffers(samples = 30)
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

    return new ShapeBuffers(vertices, indices);
}

function TetrahedronBuffers()
{
    var vertices = [
        -0.433012703, -0.409055926, 0.5,
        0.433012703, -0.409055926, 0,
        -0.144337568, 0.409055926, 0,
        -0.433012703, -0.409055926, -0.5
    ];

    var indices = [3, 1, 0, 0, 2, 3, 1, 2, 0, 3, 2, 1];
    return new ShapeBuffers(vertices, indices);
}

function CubeBuffers()
{
    var vertices = [
        -0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        0.5, 0.5, -0.5,
        -0.5, 0.5, -0.5,

        -0.5, -0.5, 0.5,
        0.5, -0.5, 0.5,
        0.5, -0.5, -0.5,
        -0.5, -0.5, -0.5
    ];

    var indices = [0, 1, 2, 0, 2, 3, // top
                   4, 5, 6, 4, 6, 7, // bottom
                   7, 4, 0, 7, 0, 3, // left
                   5, 6, 2, 5, 2, 1, // right
                   4, 5, 1, 4, 1, 0, // front
                   6, 7, 3, 6, 3, 2, // back
                ];
    return new ShapeBuffers(vertices, indices);
}