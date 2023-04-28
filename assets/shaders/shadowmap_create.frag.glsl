#version 300 es

precision highp float;

smooth in vec4 smooth_color;
smooth in vec3 smooth_position;

out vec4 FragColor;

void main() {
//

    float depth = length(smooth_position);
    depth *= (1.0 / 10.00);
    depth = clamp(depth, 0.0, 1.0);

    FragColor = vec4(depth, depth, depth, 1.0);

//    FragColor = vec4(smooth_depth, smooth_depth, smooth_depth, 1.0);
//    FragColor = vec4(smooth_color.xyz, 1.0);
}
