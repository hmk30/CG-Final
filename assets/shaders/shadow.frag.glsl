#version 300 es
/*

  author: Stephan Ohl
  Educational Code

*/


precision highp float;

struct Light {
    vec4 position;          // light position in world frame
//    vec4 position_camera;   // light position in camera frame
    vec3 La;
    vec3 Ld;
    vec3 Ls;
};

uniform Light u_Lights[2];


struct Shadowmap {
    mat4 PVM;                           // shadowmap model-view-projection matrix
    sampler2D Sampler;                  // shadowmap sampler
};

uniform Shadowmap u_Shadowmaps[2];

smooth in vec3 smooth_point_camera;     // point in camera frame
smooth in vec3 smooth_point_world;      // point in world frame
smooth in vec3 smooth_normal;           // normal in camera frame

smooth in vec3 v_Color;

out vec4 FragColor;

void main() {

    mat4 PVM0 = u_Shadowmaps[0].PVM;                            // model-view-projection matrix of shadowmap
    vec4 light0_world = u_Lights[0].position;                   // light position in camera space

    vec3 ray_light = smooth_point_world - light0_world.xyz;     // light ray:  light position -- this surface position

    vec4 pt_shadow = PVM0*vec4(smooth_point_world, 1.0);        // shadow point of surface position in shadow map
    vec3 pt_clip = (pt_shadow.xyz / pt_shadow.w);               // perspective division: transform to clip space
    vec2 pt_tex = pt_clip.xy * 0.5 + 0.5;                       // transform to 2D texture space

    // test if point is in shadow frustum (shadow clip space)
    const vec3 neg_ones = -vec3(1.0, 1.0, 1.0);
    const vec3 pos_ones = vec3(1.0, 1.0, 1.0);
    bool in_clip = !(any(lessThan(pt_clip, neg_ones)) || any(greaterThan(pt_clip, pos_ones)) );

    // lookup length of shadow ray on shadow point position in texture
    float length_light = length(ray_light);
    vec4 tex_color = texture(u_Shadowmaps[0].Sampler, pt_tex.st);
    float tex_value = tex_color.r;
    float length_shadow = 10.0 * (tex_value);                   // de-normalize

    // test if mapping is out of range
    bool is_mapped = tex_value < (1.0 - 0.01);                  // distance was not recorded in texture

    // test if point is in shadow
    bool in_shadow = (length_light - length_shadow) > 0.1;      // shadow and light ray distance tests
    in_shadow = in_shadow && in_clip && is_mapped;              // ... other technically necessary tests
    float is_illuminated = float(!in_shadow);

    // phong lighting calculations
    vec3 normal = smooth_normal;

    vec3 light = normalize(-ray_light);                         // light vector
    vec3 viewer = normalize(/* origin */ -smooth_point_camera); // view vector
    vec3 reflect = 2.0*dot(light, normal)*normal - light;       // reflect vector

    float n_dot_l = max(dot(normal, light), 0.0);               // cos(theta)
    float r_dot_v = max(dot(reflect, viewer), 0.0);             // cos(phi)

    vec3 I_ambient = vec3(1.0, 1.0, 1.0);                       // ambient light intensity
    vec3 I_light0 = vec3(1.0, 1.0, 1.0);                        // point light intensity
    vec3 k_ambient = 0.3 * vec3(0.5, 0.7, 1.0);
    vec3 k_diffuse = 0.5 * vec3(0.5, 0.7, 1.0);
    vec3 k_specular = 0.2 * vec3(1.0);
    float shiny = 10.0;

    // remove diffuse and specular reflection if surface point shadowed
    k_diffuse *= is_illuminated;
    k_specular *= is_illuminated;

    // integrate surface point color
    vec3 color = v_Color;
    color += k_ambient * I_ambient;                             // ambient reflection
    color += k_diffuse * n_dot_l * I_light0;                    // diffuse reflection
    color += k_specular * pow(r_dot_v, shiny) * I_light0;       // specular reflection

    FragColor = vec4(color, 1.0);
//    FragColor = vec4(tex_color.xyz * float(in_clip), 1.0);
}
