function Node(color, shape_buffers, local_position, local_rotation, scale, parent = null, rotation_origin = [0,0])
{
    this.local_matrix = mat4.create();
    this.local_matrix = mat4.identity(this.local_matrix);
    this.local_matrix = mat4.translate(this.local_matrix, [local_position[0], local_position[1], 0]);
    this.local_matrix = mat4.translate(this.local_matrix, [rotation_origin[0], rotation_origin[1], 0]);
    this.local_matrix = mat4.rotate(this.local_matrix, DegToRad(local_rotation), [0, 0, 1]);
    this.local_matrix = mat4.translate(this.local_matrix, [-rotation_origin[0], -rotation_origin[1], 0]);
    this.local_scale = Array.from(scale); // don't apply scale to localTransform so that children aren't affected by it
    this.color = color;
    this.shape_buffers = shape_buffers;
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
        this.local_scale[2] *= s[2];
    }

    this.addChild = function(child)
    {
        this.children.push(child);
    }
}