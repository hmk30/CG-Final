#version 300 es
/*

  author: Stephan Ohl
  Educational Code

*/


precision highp float;

smooth in vec3 smooth_point;
smooth in vec3 smooth_normal;
flat in vec3 flat_light;

out vec4 FragColor;

void main() {
    vec3 normal = smooth_normal;

    vec3 light = normalize(flat_light - smooth_point);          // light vector
    vec3 viewer = normalize(/* origin */ - smooth_point);       // view vector
    vec3 reflect = 2.0*dot(light, normal)*normal - light;       // reflect vector

    float n_dot_l = max(dot(normal, light), 0.0);               // cos(theta)
    float r_dot_v = max(dot(reflect, viewer), 0.0);             // cos(phi)

    vec3 I_ambient = vec3(1.0, 1.0, 1.0);                       // ambient light intensity
    vec3 I_light0 = vec3(1.0, 1.0, 1.0);                        // point light intensity
    vec3 k_ambient = vec3(0.1);
    vec3 k_diffuse = vec3(0.2, 0.5, 1.0);
    vec3 k_specular = vec3(0.5);
    float shiny = 20.0;

    vec3 color = vec3(0.0, 0.0, 0.0);
    color += k_ambient * I_ambient;                             // ambient reflection
    color += k_diffuse * n_dot_l * I_light0;                    // diffuse reflection
    color += k_specular * pow(r_dot_v, shiny) * I_light0;       // specular reflection

    FragColor = vec4(color, 1.0);
}
