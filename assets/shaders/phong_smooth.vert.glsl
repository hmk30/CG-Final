#version 300 es
/*

  author: Stephan Ohl
  Educational Code

*/


in vec3 a_Position;  // vertex position
in vec3 a_Normal;    // vertex normal

uniform mat4 u_VM;          // model-view matrix
uniform mat4 u_P;           // projection matrix
uniform mat4 u_PVM;         // model-view-projection matrix
uniform mat3 u_N;           // normal matrix: inverse transpose of 3x3 affine part
uniform float u_Time;
uniform int u_Mode;

struct LightSource {
    vec4 position;
    vec3 La;
    vec3 Ld;
    vec3 Ls;
};

uniform LightSource u_Lights[2];

out vec3 smooth_point;
out vec3 smooth_normal;
flat out vec3 flat_light;

void main() {
    
    LightSource light0 = u_Lights[0];

    // transform vertex
    vec4 point_model = vec4(a_Position.xyz, 1.0);               // homogenize point coordinates
    vec4 point_camera = u_VM * point_model;                     // vertex in camera frame
    vec4 point_screen = u_P * point_camera;                     // vertex in normalized camera space
    gl_Position = point_screen;

    // lighting calculations
    vec3 normal = normalize(u_N * a_Normal);                    // normal vector
    vec4 light_camera = u_VM * light0.position;                 // light position

    // hand over to fragment shader
    smooth_point = point_camera.xyz;                            // interpolate position in fragment shader
    smooth_normal = normal;                                     // interpolate normals in fragment shader
    flat_light = light_camera.xyz;                              // take light position from provoking vertex

}
