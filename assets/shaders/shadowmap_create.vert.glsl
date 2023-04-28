#version 300 es
/*

  author: Stephan Ohl
  Educational Code

*/

in vec3 a_Position;  // vertex position

uniform mat4 u_VM;   // model-view matrix
uniform mat4 u_PVM;  // model-view-projection matrix

smooth out vec4 smooth_color;
smooth out float smooth_depth;
smooth out vec3 smooth_position;

void main() {

    vec4 position_light = u_VM * vec4(a_Position, 1.0);
    vec4 position_clip = u_PVM * vec4(a_Position, 1.0);

    smooth_position = position_light.xyz;

    gl_Position = position_clip;
}
