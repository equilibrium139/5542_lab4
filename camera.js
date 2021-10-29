function Camera(position, world_up, yaw = 0, pitch = 0)
{
    this.position = vec3.create();
    vec3.set(position, this.position);
    this.world_up = vec3.create();
    vec3.set(world_up, this.world_up);
    this.yaw = yaw;
    this.pitch = pitch;
    this.x_axis = vec3.create(); 
    this.y_axis = vec3.create();
    this.z_axis = vec3.create();

    this.GetViewMatrix() = function()
    {
        
    }

    this.UpdateCameraAxes = function()
    {
        this.z_axis.x = Math.cos(this.pitch) * -Math.sin(this.yaw);
        this.z_axis.y = Math.sin(this.pitch);
        this.z_axis.z = Math.cos(this.pitch) * Math.cos(this.yaw);
        vec3.normalize(this.x_axis);

        vec3.cross(this.z_axis, this.world_up, this.x_axis);
        vec3.normalize(this.x_axis);
        vec3.cross(this.x_axis, this.z_axis, this.y_axis);
        vec3.normalize(this.y_axis);
    }
}