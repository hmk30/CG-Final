import { SHADER_TYPE, Shader, Program, loadShaderProgram } from "gl_shader";
import { Light, LightType, Shadowmap } from "gl_light";
// import { Geometry } from "gl_geometry";
import { createGeometryQuad, createGeometryPlane } from "geometries/basic";
// import { createGeometryGrid } from "geometries/grid";
// import { createGeometryHouse, createGeometryHouseWires } from "geometries/house";
// import { createGeometryTower } from "geometries/tower";
import { loadGLTF, createGeometryGLTF } from "gl_gltf";

import * as m from "gl_math";

class Scene {
  constructor(name) {
    this.name = name;
  }
}

export default async function createIlluminationScene(gl) {
  let scene = new Scene("Illumination");

  let program_simple = await loadShaderProgram(
    "assets/shaders/simple.vert.glsl",
    "assets/shaders/simple.frag.glsl"
  );
  let program_head_simple = await loadShaderProgram(
    "assets/shaders/simple.vert.glsl",
    "assets/shaders/simple.frag.glsl"
  );
  // let program_phong_flat = await loadShaderProgram(
  //   "assets/shaders/phong_flat.vert.glsl",
  //   "assets/shaders/phong_flat.frag.glsl"
  // );
  // let program_phong_smooth = await loadShaderProgram(
  //   "assets/shaders/phong_smooth.vert.glsl",
  //   "assets/shaders/phong_smooth.frag.glsl"
  // );
  let program_shadow = await loadShaderProgram(
    "assets/shaders/shadow.vert.glsl",
    "assets/shaders/shadow.frag.glsl"
  );
  // let program_texture = await loadShaderProgram(
  //   "assets/shaders/texture.vert.glsl",
  //   "assets/shaders/texture.frag.glsl"
  // );
  let program_shadowmap_create = await loadShaderProgram(
    "assets/shaders/shadowmap_create.vert.glsl",
    "assets/shaders/shadowmap_create.frag.glsl"
  );
  let program_base = await loadShaderProgram(
    "assets/shaders/shadow.vert.glsl",
    "assets/shaders/shadow.frag.glsl"
  );
  let program_column = await loadShaderProgram(
    "assets/shaders/shadow.vert.glsl",
    "assets/shaders/shadow.frag.glsl"
  );
  let program_head = await loadShaderProgram(
    "assets/shaders/shadow.vert.glsl",
    "assets/shaders/shadow.frag.glsl"
  );

  // shader programs
  scene.programs = {
    simple: program_simple,
    head_simple: program_head_simple,
    // phong_flat: program_phong_flat,
    // phong_smooth: program_phong_smooth,
    shadow: program_shadow,
    // texture: program_texture,
    shadowmap_create: program_shadowmap_create,
    base: program_base,
    column: program_column,
    head: program_head,
  };

  // create geometries
  // let grid = createGeometryGrid(gl);
  // let plane = createGeometryPlane(gl);
  // let house = createGeometryHouse(gl);
  // let house_wires = createGeometryHouseWires(gl);
  // let tower = createGeometryTower(gl);
  // let quad = createGeometryQuad(gl);

  // load geometries (LD)
  let gltf = await loadGLTF("assets/objects/Pawn_Base_LD.gltf");
  let gltf2 = await loadGLTF("assets/objects/Pawn_Column_LD.gltf");
  let gltf3 = await loadGLTF("assets/objects/Pawn_Head_LD.gltf");

  // // load geometries (HD)
  // let gltf = await loadGLTF("assets/objects/Pawn_Base.gltf");
  // let gltf2 = await loadGLTF("assets/objects/Pawn_Column.gltf");
  // let gltf3 = await loadGLTF("assets/objects/Pawn_Head.gltf");

  let base = await createGeometryGLTF(gl, gltf, 0);
  let column = await createGeometryGLTF(gl, gltf2, 0);
  let head = await createGeometryGLTF(gl, gltf3, 0);

  // set programs
  // grid.setProgram(program_simple);
  // plane.setProgram(program_shadow);
  // house.setProgram(program_shadow);
  // house_wires.setProgram(program_phong_flat);
  // tower.setProgram(program_shadow);
  // quad.setProgram(program_texture);

  base.setProgram(program_base);
  column.setProgram(program_column);
  head.setProgram(program_head);

  // add objects to scene
  scene.geometries = {
    // grid: grid,
    // plane: plane,
    // house: house,
    // house_wires: house_wires,
    // tower: tower,
    // quad: quad,

    base: base,
    column: column,
    head: head,
  };

  // create lights
  let spot0 = new Light(LightType.LIGHT_SPOT);
  // spot0.setShadowmap(new Shadowmap(256, 256));
  spot0.setShadowmap(new Shadowmap(1024, 1024));
  //
  // add lights to scene
  scene.lights = {
    spot0: spot0,
  };

  console.log("[info] scene 'Illumination' constructed");

  return scene;
}
