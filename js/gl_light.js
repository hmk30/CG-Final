import * as m from "gl_math";

export const LightType = {
    LIGHT_DIRECTIONAL: "LIGHT_DIRECTIONAL",
    LIGHT_POINT: "LIGHT_POINT",
    LIGHT_SPOT: "LIGHT_SPOT",
}


export class Light {

    constructor(light_type) {
        this.light_type = light_type;
        this.vec3_color = m.vec3_new(1.0, 1.0, 1.0);
        
        if (light_type === LightType.LIGHT_DIRECTIONAL) {
            this.vec4_position = m.vec4_new(1.0, 0.0, 0.0, 0.0);
            this.vec4_position_camera = m.vec4_new(1.0, 0.0, 0.0, 0.0);
        } else if (light_type == LightType.LIGHT_POINT) {
            this.vec4_position = m.vec4_new(0.0, 0.0, 0.0, 1.0);
            this.vec4_position_camera = m.vec4_new(0.0, 0.0, 0.0, 1.0);
        } else if (light_type == LightType.LIGHT_SPOT) {
            this.vec4_position = m.vec4_new(0.0, 0.0, 0.0, 1.0);
            this.vec4_position_camera = m.vec4_new(0.0, 0.0, 0.0, 1.0);
            this.vec3_color = m.vec3_new(1.0, 1.0, 1.0);
            this.vec3_direction = m.vec3_new(1.0, 0.0, 0.0);
            this.spot_cutoff = Math.PI;
            this.spot_focus = 1.0;
        }
    }

    setShadowmap(shadowmap) {
        this.shadowmap = shadowmap;
        // this.mat4_VM = m.mat4_new_identity();
        // this.mat4_PVM = m.mat4_new_identity();
    }

    hasShadowmap() {
        return this.shadowmap !== undefined;
    }

}

export class Shadowmap {

    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.mat4_VM = m.mat4_new_identity();
        this.mat4_P = m.mat4_new_identity();
        this.mat4_PVM = m.mat4_new_identity();
    }
    
}
