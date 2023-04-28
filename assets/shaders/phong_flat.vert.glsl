/*

  author: Stephan Ohl
  Educational Code

*/

attribute vec3 a_Position;  // vertex position
attribute vec3 a_Normal;    // vertex normal

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

varying vec4 v_Color;

void main() {
    float time = u_Time;
    const float speedA = 0.2 * (2.0 * 3.1415);
    const float speedB = 0.1 * (2.0 * 3.1415);

    // animate light in shader

    const float speedL = 0.1 * (2.0 * 3.1415);
    vec3 light_model = vec3(5.0, 2.0, 0.0);

    float angleL = speedL * time;
    // float angleL = 0.0;
    float cosL = cos(angleL);
    float sinL = sin(angleL);

    mat3 R_light = mat3(
    cosL, 0.0, sinL,
    0.0, 1.0,  0.0,
    -sinL, 0.0, cosL
    );
    vec4 light_world = vec4(R_light * light_model, 1.0);

    LightSource light0 = u_Lights[0];
    light0.position = light_world;

    // transform vertex
    vec4 point_model = vec4(a_Position.xyz, 1.0);               // homogenize point coordinates
    vec4 point_camera = u_VM * point_model;                     // vertex in camera frame
    vec4 point_screen = u_P * point_camera;                     // vertex in normalized camera space
    gl_Position = point_screen;

    // lighting calculations
    vec3 normal = normalize(u_N * a_Normal);                    // normal vector
    vec4 light_camera = u_VM * light_world;                     // light position
    vec3 light = normalize(                                     // light vector
    light_camera.xyz - point_camera.xyz
    );

    vec3 viewer = normalize(/* origin */ - point_camera.xyz);   // view vector
    vec3 reflect = 2.0*dot(light, normal)*normal - light;       // reflect vector

    float n_dot_l = max(dot(normal, light), 0.0);               // cos(theta)
    float r_dot_v = max(dot(reflect, viewer), 0.0);             // cos(phi)

    vec3 I_ambient = vec3(1.0, 1.0, 1.0);                       // ambient light intensity
    vec3 I_light0 = vec3(1.0, 1.0, 1.0);                        // point light intensity
    vec3 k_ambient = vec3(0.1);
    vec3 k_diffuse = vec3(0.2, 0.5, 1.0);
    vec3 k_specular = vec3(0.6);
    float shiny = 10.0;

    if (u_Mode == 0) {
        vec3 color = vec3(0.0, 0.0, 0.0);
        color += k_ambient * I_ambient;                           // ambient reflection
        color += k_diffuse * n_dot_l * I_light0;                  // diffuse reflection
        color += k_specular * pow(r_dot_v, shiny) * I_light0;     // specular reflection
        v_Color = vec4(color, 1.0);
    } else {
        vec3 color = vec3(0.0, 0.5, 1.0);
        v_Color = vec4(color, 1.0);
    }
}
