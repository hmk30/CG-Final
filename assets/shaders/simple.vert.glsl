attribute vec3 a_Position;

uniform mat4 u_PVM;         // model-view-projection matrix
uniform vec3 u_Color;

uniform int u_Id;

varying vec4 v_Color;

void main() {
    gl_Position = u_PVM*vec4(a_Position, 1.0);
    v_Color = vec4(u_Color, 1.0);
}
