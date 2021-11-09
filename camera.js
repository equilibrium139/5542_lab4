const FORWARD = 1;
const BACK = 2;
const RIGHT = 3;
const LEFT = 4;

function Camera(position, world_up, yaw = 0, pitch = 0) {
    this.position = vec3.create(position);
    this.world_up = vec3.create(world_up);
    this.yaw = yaw;
    this.pitch = pitch;
    this.x_axis = vec3.create();
    this.y_axis = vec3.create();
    this.z_axis = vec3.create();

    this.UpdateAxes();

    var self = this;
    document.addEventListener('mousemove', function(event)
    {
        // This if statement ensures the camera moves only when the cursor is locked onto the canvas area.
        // If the user presses escape (unlocking the cursor and making it appear), the camera no longer
        // responds to mouse movement until the pointer is locked again.
        if (document.pointerLockElement != null)
        {
            self.ProcessMouseMovement(event.movementX, event.movementY);
        }
    });
}

Camera.prototype.GetViewMatrix = function() {
    var view = mat4.create();
    var center_of_interest = vec3.create();
    vec3.subtract(this.position, this.z_axis, center_of_interest);
    mat4.lookAt(this.position, center_of_interest, this.world_up, view);
    return view;
}

Camera.prototype.UpdateAxes = function() {
    var pitch_radians = DegToRad(this.pitch);
    var yaw_radians = DegToRad(this.yaw);
    this.z_axis[0] = Math.cos(pitch_radians) * Math.sin(yaw_radians);
    this.z_axis[1] = Math.sin(pitch_radians);
    this.z_axis[2] = Math.cos(pitch_radians) * Math.cos(yaw_radians);    
    // Negated because z-axis points in the opposite direction of center of interest
    this.z_axis = vec3.scale(this.z_axis, -1); 
    vec3.normalize(this.z_axis);
    vec3.cross(this.world_up, this.z_axis, this.x_axis);
    vec3.normalize(this.x_axis);
    vec3.cross(this.z_axis, this.x_axis, this.y_axis);
    vec3.normalize(this.y_axis);
}

Camera.prototype.ProcessMouseMovement = function(delta_x, delta_y) {
    this.pitch -= delta_y * 0.1;
    this.yaw -= delta_x * 0.1;
    if (this.pitch > 89.0) this.pitch = 89.0;
    else if (this.pitch < -89.0) this.pitch = -89.0;
    this.UpdateAxes();
}

Camera.prototype.ProcessMoveCommand = function(direction) {
    var move_vector = vec3.create();

    if (direction == FORWARD) vec3.scale(this.z_axis, -0.1, move_vector);
    else if (direction == BACK) vec3.scale(this.z_axis, 0.1, move_vector);
    else if (direction == RIGHT) vec3.scale(this.x_axis, 0.1, move_vector);
    else vec3.scale(this.x_axis, -0.1, move_vector);

    vec3.add(this.position, move_vector, this.position);
}
