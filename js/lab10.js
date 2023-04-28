import * as m from "gl_math";
import { default as createIlluminationScene } from "scene_illumination";

let context = {};
let scene = {};

function initRender3D(context) {
  let ctx = context;

  // get HTML canvas element
  let canvas = document.querySelector("#canvas_gl");
  ctx.canvas = canvas;
  ctx.canvas.aspect = canvas.width / canvas.height;

  // get WebGL context
  let gl = canvas.getContext("webgl2");
  ctx.gl = gl;
  if (gl == null) {
    console.error("Can't get WebGL context.");
    return;
  }

  console.log(`[info] ${gl.getParameter(gl.VERSION)}`);
  console.log(`[info] ${gl.getParameter(gl.SHADING_LANGUAGE_VERSION)}`);

  // setup WebGL
  gl.frontFace(gl.CCW); // standard: GL_CCW
  gl.cullFace(gl.BACK); // standard: GL_BACK
  gl.enable(gl.CULL_FACE);

  gl.depthFunc(gl.LESS); // standard: GL_LESS
  gl.enable(gl.DEPTH_TEST);

  // init viewer position and orientation
  context.viewer_azimuth = Math.PI * 0.25;
  context.viewer_altitude = Math.PI * 0.25;
  context.viewer_distance = 5.0;

  context.viewer_azimuth_down = context.viewer_azimuth;
  context.viewer_altitude_down = context.viewer_altitude;
  context.viewer_distance_down = context.viewer_distance;

  // create view and projection matrices
  context.mat4_VM = m.mat4_new_identity(); // model-view matrix
  context.mat4_P = m.mat4_new_identity(); // projection matrix
  context.mat4_PVM = m.mat4_new_identity(); // model-view-projection matrix
  context.mat3_N = m.mat3_new_identity(); // normal matrix: inverse transpose of 3x3 affine part
}

function initScene(context, scene) {
  let ctx = context;
  let gl = context.gl;

  // compile all shaders that are attached to scene
  for (const [name, program] of Object.entries(scene.programs)) {
    console.log("[info] compile program '" + name + "'");
    program.id = createProgram(gl, program.vertex_shader.source, program.fragment_shader.source);
    if (program.id == null) {
      console.log("[error] compiling program '" + name + "'");
      return false;
    }
    program.is_compiled = true;

    // get active attributes
    let n_attribs = gl.getProgramParameter(program.id, gl.ACTIVE_ATTRIBUTES);
    for (let j = 0; j < n_attribs; ++j) {
      let info = gl.getActiveAttrib(program.id, j);
      let loc = gl.getAttribLocation(program.id, info.name);
      console.log("  found attribute '" + info.name + "'");
      program.attributes[info.name] = loc;
    }

    // get active uniforms
    let n_uniforms = gl.getProgramParameter(program.id, gl.ACTIVE_UNIFORMS);
    for (let j = 0; j < n_uniforms; ++j) {
      let info = gl.getActiveUniform(program.id, j);
      let loc = gl.getUniformLocation(program.id, info.name);
      console.log("  found uniform '" + info.name + "'");
      program.uniforms[info.name] = loc;
    }
  }

  // create WebGL buffers for all geometries
  for (const [name, geometry] of Object.entries(scene.geometries)) {
    console.log(
      "[info] creating buffers for geometry '" +
        name +
        "' with " +
        geometry.primitives +
        " primitives"
    );

    // create attribute buffers
    for (const [attribute_name, buffer] of Object.entries(geometry.buffers)) {
      console.log("  buffer for attribute '" + attribute_name + "'");
      let buffer_gl = gl.createBuffer();
      geometry.buffers_gl[attribute_name] = buffer_gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer_gl);
      gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW);
    }

    // create index (element) buffer
    if (geometry.elements) {
      console.log("  buffer for elements");
      let elements_gl = gl.createBuffer();
      geometry.elements_gl = elements_gl;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elements_gl);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.elements, gl.STATIC_DRAW);
    }
  }

  // attach render functions to shader programs
  scene.programs["simple"].setRenderGeometryFunc(renderGeometrySimpleProgram);
  // scene.programs["phong_flat"].setRenderGeometryFunc(renderGeometryPhongProgram);
  scene.programs["shadow"].setRenderGeometryFunc(renderGeometryShadowProgram);
  // scene.programs["texture"].setRenderGeometryFunc(renderGeometryTextureProgram);

  scene.programs["base"].setRenderGeometryFunc(renderPawnBase);
  scene.programs["column"].setRenderGeometryFunc(renderPawnColumn);
  scene.programs["head"].setRenderGeometryFunc(renderPawnHead);
  scene.programs["head_simple"].setRenderGeometryFunc(renderHeadSimple);

  return true;
}

function initShadowMapping(context, scene) {
  let ctx = context;
  let gl = context.gl;
  // const SHADOWMAP_WIDTH = 256;
  // const SHADOWMAP_HEIGHT = 256;

  // init lights
  for (const [name, light] of Object.entries(scene.lights)) {
  }

  // create shadow maps
  for (const [name, light] of Object.entries(scene.lights)) {
    if (!light.hasShadowmap()) continue;

    console.log(`[info] creating shadow map for light '${name}'`);

    // create Frame Buffer Object (FBO)
    light.shadowmap.fbo = gl.createFramebuffer();

    // create Texture for FBO color attachment and set parameters
    //   regarding texture format and texture processing
    light.shadowmap.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, light.shadowmap.texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      light.shadowmap.width,
      light.shadowmap.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // create Render Buffer for FBO depth attachment and set parameters
    light.shadowmap.depthbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, light.shadowmap.depthbuffer);
    gl.renderbufferStorage(
      gl.RENDERBUFFER,
      gl.DEPTH_COMPONENT16,
      light.shadowmap.width,
      light.shadowmap.height
    );

    // attach texture and render buffer to FBO
    gl.bindFramebuffer(gl.FRAMEBUFFER, light.shadowmap.fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      light.shadowmap.texture,
      0
    );
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.RENDERBUFFER,
      light.shadowmap.depthbuffer,
      0
    );

    const result = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (result !== gl.FRAMEBUFFER_COMPLETE) {
      console.log(`[error] Problems creating FBO: ${result}`);
    }

    // // attach shadow matrix (identity)
    // light.shadowmap.mat4_vmp = mat4_new();
  }
}

function initMouseHandler(context) {
  context.is_mouse_down = false;
  context.mouse_down = [0.0, 0.0];
  context.mouse_move = [0.0, 0.0];
  context.mouse_wheel = 0.0;

  context.canvas.onmousedown = function (event) {
    let rect = event.target.getBoundingClientRect();

    context.is_mouse_down = true;
    context.mouse_down = transformClient2WebGL(
      [rect.left, rect.top, context.canvas.width, context.canvas.height],
      [event.clientX, event.clientY]
    );
    context.mouse_move = context.mouse_down;

    context.viewer_azimuth_down = context.viewer_azimuth;
    context.viewer_altitude_down = context.viewer_altitude;
    context.viewer_distance_down = context.viewer_distance;

    // store click, useful separation from is_mouse_down to handle
    // single clicks, instead of drag
    context.clicked = true;
  };

  context.canvas.onmousemove = function (event) {
    let rect = event.target.getBoundingClientRect();

    // if (!context.is_mouse_down) {
    //   return;
    // }

    context.mouse_move = transformClient2WebGL(
      [rect.left, rect.top, context.canvas.width, context.canvas.height],
      [event.clientX, event.clientY]
    );

    // store client x and y for picking
    context.client_mouse_x = event.clientX;
    context.client_mouse_y = event.clientY;

    context.canvas_mouse_x = event.clientX - rect.left;
    context.canvas_mouse_y = rect.height - (event.clientY - rect.top);
  };

  context.canvas.onmouseup = function (event) {
    context.is_mouse_down = false;
  };

  context.canvas.onmouseout = function (event) {
    context.is_mouse_down = false;
  };

  context.canvas.onwheel = function (event) {
    context.mouse_wheel += event.deltaY;
    event.preventDefault();
  };
}

async function init(context) {
  initRender3D(context);
  initMouseHandler(context);
  scene = await createIlluminationScene(context.gl);
  initScene(context, scene);
  initShadowMapping(context, scene);
  initMouseHandler(context);
  initKeyboardHandler(context);
}

function initKeyboardHandler(context) {
  context.renderPickOnly = false;
  context.lockPicking = false;
  context.animationStyle = 0;
  document.addEventListener("keypress", (e) => {
    // switch render mode
    if (e.key === "r") {
      let newValue = !context.renderPickOnly;
      let str = newValue ? "Picking Pass Only" : "Full Scene";
      console.log(`Switching render mode: ${str}`);

      context.renderPickOnly = newValue;
      document.querySelector("#render-mode").innerText = str;
    }
    // lock picking
    else if (e.key === "l") {
      let newValue = !context.lockPicking;
      let str = newValue ? "Locked" : "Unlocked";
      console.log(`Switching picking mode: ${str}`);

      context.lockPicking = newValue;
      document.querySelector("#lock-picking-status").innerText = str;
    }
    // switch animations
    else if (e.key === "a") {
      let oldValue = context.animationStyle;
      let newValue = (oldValue + 1) % 3;
      let str;
      if (newValue === 0) str = "Linear";
      else if (newValue === 1) str = "Ease-in-out";
      else if (newValue === 2) str = "Ease-in-out-cubic";
      console.log(`Switching animation style: ${str}`);

      context.animationStyle = newValue;
      document.querySelector("#animation-style").innerText = str;
    }
  });
}

function transformClient2WebGL(canvas, mouse) {
  // transform in matrix-vector notation
  // c_wx, c_wy -- canvas width
  // c_x, c_y -- canvas position
  // m_x, m_y -- mouse position
  //
  // ┏ 1  0 ┓   ┏ 2/c_wx       0 ┓ ┏ m_x - c_x ┓   ┏ - 1.0 ┓
  // ┗ 0 -1 ┛ ( ┗      0  2/c_wy ┛ ┗ m_y - c_y ┛ + ┗ - 1.0 ┛ )
  //
  let x_premul = 2.0 / canvas[2];
  let y_premul = -2.0 / canvas[3];
  let x = x_premul * (mouse[0] - canvas[0]) - 1.0;
  let y = y_premul * (mouse[1] - canvas[1]) + 1.0;

  return [x, y];
}

/*
 * The update() function updates the model
 * that you want to render; it changes the
 * state of the model.
 */
function update(context, timestamp) {
  let ctx = context; // shortcut alias
  let gl = context.gl; // shortcut alias

  // lazy initialization
  if (!ctx.timestamp_last) {
    ctx.timestamp_last = timestamp;
    ctx.timestamp_init = timestamp;
    ctx.time = 0.0;
    ctx.angle = 0.0;
    ctx.speed = 20.0; // degree per second
    ctx.speed_zoom = 0.004;
    return;
  }

  // get timestamps and update context
  let ts_init = ctx.timestamp_init; // initial timestamp in ms
  let ts_last = ctx.timestamp_last; // last timestamp in ms
  let ts_curr = timestamp; // current timestamp in ms
  ctx.timestamp_last = timestamp;
  ctx.time = (timestamp - ctx.timestamp_init) * 0.001;

  // setup viewer
  context.viewer_distance -= context.speed_zoom * context.mouse_wheel;
  context.mouse_wheel = 0.0;
  context.viewer_distance = Math.max(1.0, Math.min(context.viewer_distance, 10.0));
  let dist = context.viewer_distance;
  let altitude = context.viewer_altitude;
  let azimuth = context.viewer_azimuth;

  if (context.is_mouse_down) {
    let speed_altitude = 1.0;
    let speed_azimuth = 1.0;
    let dx = context.mouse_move[0] - context.mouse_down[0];
    let dy = context.mouse_move[1] - context.mouse_down[1];
    altitude = context.viewer_altitude_down + speed_altitude * -dy;
    azimuth = context.viewer_azimuth_down + speed_azimuth * dx;
    altitude = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, altitude));
    context.viewer_altitude = altitude;
    context.viewer_azimuth = azimuth;
  }

  let cosAltitude = Math.cos(altitude);
  let sinAltitude = Math.sin(altitude);
  let cosAzimuth = Math.cos(azimuth);
  let sinAzimuth = Math.sin(azimuth);

  let eye0_x = cosAltitude * dist;
  let eye1_y = sinAltitude * dist;
  let eye1_x = cosAzimuth * eye0_x;
  let eye1_z = sinAzimuth * eye0_x;

  let eye = [eye1_x, eye1_y, eye1_z];
  // let center = [0, 0, 0];
  let center = [0, 2, 0];
  let up = [0, 1, 0];

  // update viewer camera
  let aspect = context.canvas.aspect;

  m.mat4_set_lookat(ctx.mat4_VM, eye, center, up);
  m.mat4_set_perspective(ctx.mat4_P, 1.5, aspect, 0.1, 100.0);

  // mat4_set_orthogonal(ctx.mat4_P, -10, 10, -10, 10, 100, -100);
  // mat4_set_identity(ctx.mat4_P);

  m.mat4_mul_mat4(ctx.mat4_PVM, ctx.mat4_P, ctx.mat4_VM);
  m.mat4_get_topleft_mat3(ctx.mat4_VM, ctx.mat3_N); // we just do euclidian

  // update rotating light
  const spot0 = scene.lights.spot0;

  if (spot0.speed === undefined) {
    spot0.speed = 0.1 * (2.0 * Math.PI); // set rotation speed [turns / s]
    spot0.vec4_init = m.vec4_new(2.0, 4.0, 0.0, 1.0); // initial position of light in model space
    spot0.mat4_Rt = m.mat4_new_identity(); // rotation matrix
    spot0.vec3_position = m.vec3_new(0.0, 0.0, 0.0); // inhomogeneous position
    spot0.vec3_center = m.vec3_new(0.0, 1.0, 0.0); // look-at center
    spot0.vec3_up = m.vec3_new(0.0, 1.0, 0.0); // up vector
  }

  // spot0.speed = 0;

  //   spot0 position update (in world frame)
  spot0.angle = ctx.time * spot0.speed;
  m.mat4_set_identity(spot0.mat4_Rt);
  spot0.mat4_Rt[0] = Math.cos(spot0.angle);
  spot0.mat4_Rt[2] = Math.sin(spot0.angle);
  spot0.mat4_Rt[8] = -spot0.mat4_Rt[2];
  spot0.mat4_Rt[10] = spot0.mat4_Rt[0];
  m.mat4_mul_vec4(spot0.vec4_position, spot0.mat4_Rt, spot0.vec4_init);

  //   spot0 position in camera frame (viewer position frame)
  m.mat4_mul_vec4(spot0.vec4_position_camera, ctx.mat4_VM, spot0.vec4_position);

  //   spot0 direction update
  m.vec3_cpy_from_vec4(spot0.vec3_position, spot0.vec4_position);
  m.vec3_sub(spot0.vec3_direction, spot0.vec3_center, spot0.vec3_position);

  // update model-view-projection matrices for light
  //   parameters set_lookat(): eye, center, up
  //   parameters set_perspective(): fov (in radians), aspect, near, far
  m.mat4_set_lookat(spot0.shadowmap.mat4_VM, spot0.vec3_position, spot0.vec3_center, spot0.vec3_up);
  m.mat4_set_perspective(spot0.shadowmap.mat4_P, 0.5 * Math.PI, 1.0, 0.1, 100.0);
  m.mat4_mul_mat4(spot0.shadowmap.mat4_PVM, spot0.shadowmap.mat4_P, spot0.shadowmap.mat4_VM);
}

function renderGeometrySimpleProgram(gl, program, geometry) {
  let buf_gl = geometry.buffers_gl["a_Position"];
  let buf = geometry.buffers["a_Position"];

  gl.useProgram(program.id);
  gl.bindBuffer(gl.ARRAY_BUFFER, buf_gl);
  gl.vertexAttribPointer(program.attributes.a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.uniform3f(program.uniforms.u_Color, 0.9, 0.9, 0.9);
  gl.uniformMatrix4fv(program.uniforms.u_PVM, true, context.mat4_PVM);
  gl.drawArrays(geometry.primitives_type, 0, geometry.elements_count);
}

/**
 * START TRANSLATION ANIMATION REGION
 */

// how long the animation lasts
const ANIM_DURATION = 1000;

// the translate value
let g_value = 0;
let g_startTime = null;

function animate(currentTime) {
  if (!g_startTime) {
    g_startTime = currentTime;
  }

  const elapsedTime = currentTime - g_startTime;
  const progress = Math.min(1, elapsedTime / ANIM_DURATION);

  // smooth value if requested
  let easeProgress;
  if (context.animationStyle == 0) {
    easeProgress = progress;
  } else if (context.animationStyle == 1) {
    easeProgress = easeInOut(progress);
  } else if (context.animationStyle == 2) {
    easeProgress = easeInOutCubic(progress);
  }
  // Scale the value from 0 to 2
  g_value = easeProgress * 2;

  // until finished, keep requesting animations
  if (progress < 1) {
    requestAnimationFrame(animate);
  }
}

// x as 'progress', should be between 0 and 1
// returns smoothed progress
function easeInOut(x) {
  // ease in
  if (x < 0.5) {
    return 2 * Math.pow(x, 2);

    // ease out
  } else {
    return 1 - 2 * Math.pow(x - 1, 2);
  }
}

function easeInOutCubic(x) {
  if (x < 0.5) {
    return 4 * Math.pow(x, 3);
  } else {
    return 1 + 4 * Math.pow(x - 1, 3);
  }
}

function start_animate() {
  requestAnimationFrame(animate);
}

/**
 * END TRANSLATION ANIMATION REGION
 */

/**
 * START COLOR ANIMATION REGION
 */

let g_color = [0, 0, 0];
let g_color_prev = [...g_color];
let g_target_color = [0, 0, 0];

let g_start_time_color = null;

// how long to change from one color to the next
const COLOR_ANIMATION_DURATION = 1500;

// how long stay on the final color for
// before beginning animation to next
const COLOR_STAY_DURATION = 3000;

// function random_color() {
//   // divide by n to make sure the colors aren't too bright
//   let n = 3;
//   // add o to offset colors away from black
//   let o = 0.2;

//   let r = Math.random() / n + o;
//   let g = Math.random() / n + o;
//   let b = Math.random() / n + o;
//   return [r, g, b];
// }

// possible colors
// randomly generating rgb values gave some bad looking colors
const colors = {
  red: [1, 0, 0],
  green: [0, 1, 0],
  blue: [0, 0, 1],
  yellow: [1, 1, 0],
  magenta: [1, 0, 1],
  cyan: [0, 1, 1],
  // white: [1, 1, 1],
  // black: [0, 0, 0],
  // gray: [0.5, 0.5, 0.5],
  // maroon: [0.5, 0, 0],
  // olive: [0.5, 0.5, 0],
  // darkGreen: [0, 0.5, 0],
  // teal: [0, 0.5, 0.5],
  // navy: [0, 0, 0.5],
  // purple: [0.5, 0, 0.5],
  // brown: [0.5, 0.25, 0],
};

function random_color() {
  const randomIndex = Math.floor(Math.random() * Object.keys(colors).length);
  const randomColorName = Object.keys(colors)[randomIndex];
  const randomColor = colors[randomColorName];

  console.log(`Changing color to: ${randomColorName}`);

  // divide color values so they aren't as bright
  return randomColor.map((value) => value / 2);
}

// linear interpolate a towards b by a factor of t
function lerp(a, b, t) {
  let res = a + (b - a) * t;
  return res;
}

// over COLOR_ANIMATION_DURATION time, shift g_color
// to the value of g_target_color
// after completion, pick new g_target_color and repeat
function animate_color(time) {
  if (g_start_time_color === null) {
    g_start_time_color = time;
  }

  const elapsed = time - g_start_time_color;
  const progress = Math.min(1, elapsed / COLOR_ANIMATION_DURATION);

  // lerp g_color towards g_target_color
  g_color[0] = lerp(g_color_prev[0], g_target_color[0], progress);
  g_color[1] = lerp(g_color_prev[1], g_target_color[1], progress);
  g_color[2] = lerp(g_color_prev[2], g_target_color[2], progress);

  // pick a new color when animation is done, and stay length is exceeded
  if (elapsed > COLOR_ANIMATION_DURATION + COLOR_STAY_DURATION) {
    g_target_color = random_color();
    g_color_prev = [...g_color];
    g_start_time_color = time;
  }

  requestAnimationFrame(animate_color);
}

// initialize g_color animation
g_target_color = random_color();
requestAnimationFrame(animate_color);

/**
 * END COLOR ANIMATION REGION
 */

function renderPawnBase(gl, program, geometry) {
  let buf_gl_Position = geometry.buffers_gl.a_Position;
  let buf_gl_Normal = geometry.buffers_gl.a_Normal;
  let buf_gl_elements = geometry.elements_gl;

  gl.useProgram(program.id); // .id contains the WebGL identifier

  // setup attribute pointers (attributes are different for each vertex)
  gl.bindBuffer(gl.ARRAY_BUFFER, buf_gl_Position);
  gl.vertexAttribPointer(program.attributes.a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(program.attributes.a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, buf_gl_Normal);
  gl.vertexAttribPointer(program.attributes.a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(program.attributes.a_Normal);

  // // move pawn away from ground
  // // there is a hierarchy! base,column,head all move down
  // const translation_matrix = [1, 0, 0, 0, 0, 1, 0, 2, 0, 0, 1, 0, 0, 0, 0, 1];
  // m.mat4_mul_mat4(context.mat4_VM, context.mat4_VM, translation_matrix);

  // check if base is selected, if so, move it down (hard-coded)
  // if base or column is selected, move self down
  // hierarchy, so moves column and head with it
  if (context.selectedID === 163 || context.selectedID === 82) {
    start_animate();
    let value = -g_value;
    const translation_matrix = [1, 0, 0, 0, 0, 1, 0, value, 0, 0, 1, 0, 0, 0, 0, 1];
    m.mat4_mul_mat4(context.mat4_VM, context.mat4_VM, translation_matrix);
  }

  // set uniforms (uniforms are same for all vertices)
  gl.uniform1f(program.uniforms.u_Time, context.time);
  gl.uniform1i(program.uniforms.u_Mode, 0);
  gl.uniformMatrix4fv(program.uniforms.u_VM, true, context.mat4_VM);
  gl.uniformMatrix4fv(program.uniforms.u_P, true, context.mat4_P);
  gl.uniformMatrix4fv(program.uniforms.u_PVM, true, context.mat4_PVM);
  gl.uniformMatrix3fv(program.uniforms.u_N, true, context.mat3_N);

  // pass color in
  gl.uniform3fv(program.uniforms.u_Color, g_color);

  // light parameters
  const spot0 = scene.lights.spot0;

  gl.uniform4fv(program.uniforms["u_Lights[0].position"], spot0.vec4_position);
  gl.uniform4fv(program.uniforms["u_Lights[0].position_camera"], spot0.vec4_position_camera);

  // shadow mapping
  gl.uniformMatrix4fv(program.uniforms["u_Shadowmaps[0].PVM"], true, spot0.shadowmap.mat4_PVM);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, spot0.shadowmap.texture);

  // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256,
  //     0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.uniform1i(program.uniforms["u_Shadowmaps[0].Sampler"], 0); // use texture unit 0

  // bind element buffer and draw elements
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf_gl_elements);
  gl.drawElements(geometry.primitives_type, geometry.elements_count, geometry.elements_type, 0);
}

function renderPawnColumn(gl, program, geometry) {
  let buf_gl_Position = geometry.buffers_gl.a_Position;
  let buf_gl_Normal = geometry.buffers_gl.a_Normal;
  let buf_gl_elements = geometry.elements_gl;

  gl.useProgram(program.id); // .id contains the WebGL identifier

  // setup attribute pointers (attributes are different for each vertex)
  gl.bindBuffer(gl.ARRAY_BUFFER, buf_gl_Position);
  gl.vertexAttribPointer(program.attributes.a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(program.attributes.a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, buf_gl_Normal);
  gl.vertexAttribPointer(program.attributes.a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(program.attributes.a_Normal);

  // if base or column is selected, move self up
  // (either selection means base moved down)
  // (hierarchy, so base moving down moves this down as well)
  // (translate back up into normal position)
  if (context.selectedID === 163 || context.selectedID === 82) {
    let value = g_value;
    const translation_matrix = [1, 0, 0, 0, 0, 1, 0, value, 0, 0, 1, 0, 0, 0, 0, 1];
    m.mat4_mul_mat4(context.mat4_VM, context.mat4_VM, translation_matrix);
  }

  // set uniforms (uniforms are same for all vertices)
  gl.uniform1f(program.uniforms.u_Time, context.time);
  gl.uniform1i(program.uniforms.u_Mode, 0);
  gl.uniformMatrix4fv(program.uniforms.u_VM, true, context.mat4_VM);
  gl.uniformMatrix4fv(program.uniforms.u_P, true, context.mat4_P);
  gl.uniformMatrix4fv(program.uniforms.u_PVM, true, context.mat4_PVM);
  gl.uniformMatrix3fv(program.uniforms.u_N, true, context.mat3_N);

  // pass color in
  gl.uniform3fv(program.uniforms.u_Color, g_color);

  // light parameters
  const spot0 = scene.lights.spot0;

  gl.uniform4fv(program.uniforms["u_Lights[0].position"], spot0.vec4_position);
  gl.uniform4fv(program.uniforms["u_Lights[0].position_camera"], spot0.vec4_position_camera);

  // shadow mapping
  gl.uniformMatrix4fv(program.uniforms["u_Shadowmaps[0].PVM"], true, spot0.shadowmap.mat4_PVM);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, spot0.shadowmap.texture);

  // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256,
  //     0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.uniform1i(program.uniforms["u_Shadowmaps[0].Sampler"], 0); // use texture unit 0

  // bind element buffer and draw elements
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf_gl_elements);
  gl.drawElements(geometry.primitives_type, geometry.elements_count, geometry.elements_type, 0);
}

function renderPawnHead(gl, program, geometry) {
  let buf_gl_Position = geometry.buffers_gl.a_Position;
  let buf_gl_Normal = geometry.buffers_gl.a_Normal;
  let buf_gl_elements = geometry.elements_gl;

  gl.useProgram(program.id); // .id contains the WebGL identifier

  // setup attribute pointers (attributes are different for each vertex)
  gl.bindBuffer(gl.ARRAY_BUFFER, buf_gl_Position);
  gl.vertexAttribPointer(program.attributes.a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(program.attributes.a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, buf_gl_Normal);
  gl.vertexAttribPointer(program.attributes.a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(program.attributes.a_Normal);

  // if head was clicked, start animation
  if (context.selectedID === 122) {
    start_animate();
  }

  // if head or column is selected, move self up
  if (context.selectedID === 82 || context.selectedID === 122) {
    let value = g_value;
    const translation_matrix = [1, 0, 0, 0, 0, 1, 0, value, 0, 0, 1, 0, 0, 0, 0, 1];
    m.mat4_mul_mat4(context.mat4_VM, context.mat4_VM, translation_matrix);
  }

  // set uniforms (uniforms are same for all vertices)
  gl.uniform1f(program.uniforms.u_Time, context.time);
  gl.uniform1i(program.uniforms.u_Mode, 0);
  gl.uniformMatrix4fv(program.uniforms.u_VM, true, context.mat4_VM);
  gl.uniformMatrix4fv(program.uniforms.u_P, true, context.mat4_P);
  gl.uniformMatrix4fv(program.uniforms.u_PVM, true, context.mat4_PVM);
  gl.uniformMatrix3fv(program.uniforms.u_N, true, context.mat3_N);

  // pass color in
  gl.uniform3fv(program.uniforms.u_Color, g_color);

  // light parameters
  const spot0 = scene.lights.spot0;

  gl.uniform4fv(program.uniforms["u_Lights[0].position"], spot0.vec4_position);
  gl.uniform4fv(program.uniforms["u_Lights[0].position_camera"], spot0.vec4_position_camera);

  // shadow mapping
  gl.uniformMatrix4fv(program.uniforms["u_Shadowmaps[0].PVM"], true, spot0.shadowmap.mat4_PVM);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, spot0.shadowmap.texture);

  // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256,
  //     0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.uniform1i(program.uniforms["u_Shadowmaps[0].Sampler"], 0); // use texture unit 0

  // bind element buffer and draw elements
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf_gl_elements);
  gl.drawElements(geometry.primitives_type, geometry.elements_count, geometry.elements_type, 0);
}

function renderHeadSimple(gl, program, geometry) {
  let buf_gl_Position = geometry.buffers_gl.a_Position;
  let buf_gl_elements = geometry.elements_gl;

  gl.useProgram(program.id); // .id contains the WebGL identifier

  // setup attribute pointers (attributes are different for each vertex)
  gl.bindBuffer(gl.ARRAY_BUFFER, buf_gl_Position);
  gl.vertexAttribPointer(program.attributes.a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(program.attributes.a_Position);

  // set uniforms (uniforms are same for all vertices)
  gl.uniformMatrix4fv(program.uniforms.u_PVM, true, context.mat4_PVM);

  // // pass color in
  // gl.uniform3fv(program.uniforms.u_Color, [1.0, 0.0, 1.0]);

  // bind element buffer and draw elements
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf_gl_elements);
  gl.drawElements(geometry.primitives_type, geometry.elements_count, geometry.elements_type, 0);
}

// function renderGeometryTextureProgram(gl, program, geometry) {
//   let buf_gl_Position = geometry.buffers_gl.a_Position;
//   let buf_gl_Normal = geometry.buffers_gl.a_Normal;
//   let buf_gl_TexCoord = geometry.buffers_gl.a_TexCoord;
//   let buf_gl_elements = geometry.elements_gl;

//   gl.useProgram(program.id); // .id contains the WebGL identifier

//   // setup attribute pointers (attributes are different for each vertex)
//   gl.bindBuffer(gl.ARRAY_BUFFER, buf_gl_Position);
//   gl.vertexAttribPointer(program.attributes.a_Position, 3, gl.FLOAT, false, 0, 0);
//   gl.enableVertexAttribArray(program.attributes.a_Position);

//   gl.bindBuffer(gl.ARRAY_BUFFER, buf_gl_Normal);
//   gl.vertexAttribPointer(program.attributes.a_Normal, 3, gl.FLOAT, false, 0, 0);
//   gl.enableVertexAttribArray(program.attributes.a_Normal);

//   gl.bindBuffer(gl.ARRAY_BUFFER, buf_gl_TexCoord);
//   gl.vertexAttribPointer(program.attributes.a_TexCoord, 2, gl.FLOAT, false, 0, 0);
//   gl.enableVertexAttribArray(program.attributes.a_TexCoord);

//   // set uniforms (uniforms are same for all vertices)
//   gl.uniform1f(program.uniforms.u_Time, context.time);
//   gl.uniform1i(program.uniforms.u_Mode, 0);
//   gl.uniformMatrix4fv(program.uniforms.u_VM, true, context.mat4_VM);
//   gl.uniformMatrix4fv(program.uniforms.u_P, true, context.mat4_P);
//   gl.uniformMatrix4fv(program.uniforms.u_PVM, true, context.mat4_PVM);
//   gl.uniformMatrix3fv(program.uniforms.u_N, true, context.mat3_N);

//   // light and shadow setting
//   const spot0 = scene.lights.spot0;

//   gl.activeTexture(gl.TEXTURE0); // active texture unit 0
//   gl.bindTexture(gl.TEXTURE_2D, spot0.shadowmap.texture);
//   gl.uniform1i(program.uniforms.u_SamplerShadow, 0); // use texture unit 0
//   gl.uniform4fv(program.uniforms["u_Lights[0].position"], scene.lights.spot0.vec4_position);

//   // bind element buffer and draw elements
//   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf_gl_elements);
//   gl.drawElements(geometry.primitives_type, geometry.elements_count, geometry.elements_type, 0);
// }

function renderGeometryShadowProgram(gl, program, geometry) {
  let buf_gl_Position = geometry.buffers_gl.a_Position;
  let buf_gl_Normal = geometry.buffers_gl.a_Normal;
  let buf_gl_elements = geometry.elements_gl;

  gl.useProgram(program.id); // .id contains the WebGL identifier

  // setup attribute pointers (attributes are different for each vertex)
  gl.bindBuffer(gl.ARRAY_BUFFER, buf_gl_Position);
  gl.vertexAttribPointer(program.attributes.a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(program.attributes.a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, buf_gl_Normal);
  gl.vertexAttribPointer(program.attributes.a_Normal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(program.attributes.a_Normal);

  const translation_matrix = [1, 0, 0, 0, 0, 1, 0, -2, 0, 0, 1, 0, 0, 0, 0, 1];
  m.mat4_mul_mat4(context.mat4_VM, context.mat4_VM, translation_matrix);

  // set uniforms (uniforms are same for all vertices)
  gl.uniform1f(program.uniforms.u_Time, context.time);
  gl.uniform1i(program.uniforms.u_Mode, 0);
  gl.uniformMatrix4fv(program.uniforms.u_VM, true, context.mat4_VM);
  gl.uniformMatrix4fv(program.uniforms.u_P, true, context.mat4_P);
  gl.uniformMatrix4fv(program.uniforms.u_PVM, true, context.mat4_PVM);
  gl.uniformMatrix3fv(program.uniforms.u_N, true, context.mat3_N);

  // // pass color in
  // gl.uniform3fv(program.uniforms.u_Color, [1.0, 0.0, 1.0]);

  // light parameters
  const spot0 = scene.lights.spot0;

  gl.uniform4fv(program.uniforms["u_Lights[0].position"], spot0.vec4_position);
  gl.uniform4fv(program.uniforms["u_Lights[0].position_camera"], spot0.vec4_position_camera);

  // shadow mapping
  gl.uniformMatrix4fv(program.uniforms["u_Shadowmaps[0].PVM"], true, spot0.shadowmap.mat4_PVM);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, spot0.shadowmap.texture);

  // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256,
  //     0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.uniform1i(program.uniforms["u_Shadowmaps[0].Sampler"], 0); // use texture unit 0

  // bind element buffer and draw elements
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf_gl_elements);
  gl.drawElements(geometry.primitives_type, geometry.elements_count, geometry.elements_type, 0);
}

function render_pass_shadows_geometry(program) {
  let ctx = context;
  let gl = context.gl;

  // loop over geometry
  for (const [name, geometry] of Object.entries(scene.geometries)) {
    // render only indexed-buffer geometry
    if (!geometry.hasElements()) continue;

    // setup attribute pointers (attributes are different for each vertex)
    gl.bindBuffer(gl.ARRAY_BUFFER, geometry.buffers_gl.a_Position);
    gl.vertexAttribPointer(program.attributes.a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(program.attributes.a_Position);

    // bind element buffer and draw elements
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.elements_gl);
    gl.drawElements(geometry.primitives_type, geometry.elements_count, geometry.elements_type, 0);
  }
}

function render_pass_shadows() {
  let ctx = context;
  let gl = context.gl;

  // create shadow maps with special 'shadowmap_create' shader program
  let program = scene.programs.shadowmap_create;
  for (const [name, light] of Object.entries(scene.lights)) {
    if (!light.hasShadowmap()) continue;

    // render from light point to FBO
    gl.bindFramebuffer(gl.FRAMEBUFFER, light.shadowmap.fbo);
    gl.viewport(0, 0, light.shadowmap.width, light.shadowmap.height);

    // clear FBO's color and depth attachements
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // set up program to create shadow map
    gl.useProgram(program.id);
    gl.uniformMatrix4fv(program.uniforms.u_VM, true, light.shadowmap.mat4_VM);
    gl.uniformMatrix4fv(program.uniforms.u_PVM, true, light.shadowmap.mat4_PVM);

    // render geometry
    render_pass_shadows_geometry(program);
  }
}

function render_pass_final() {
  let ctx = context;
  let canvas = context.canvas;
  let gl = context.gl;

  // reset framebuffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.95, 0.95, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  for (const [name, geometry] of Object.entries(scene.geometries)) {
    if (!geometry.hasProgram()) continue;

    let program = geometry.getProgram();
    if (program.canRenderGeometry()) {
      // here: pick render function based on shader program
      program.renderGeometry(gl, geometry);
      continue;
    }
  }
}

function render_pass_pick() {
  let ctx = context;
  let canvas = context.canvas;
  let gl = context.gl;
  // render pass: PICK

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  // gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.9, 0.8, 0.8, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let r = 0.32;
  let g = 0.0;
  let b = 0.0;

  for (const [name, geometry] of Object.entries(scene.geometries)) {
    if (!geometry.hasProgram()) continue;

    // let program = geometry.getProgram();

    let program = scene.programs["head_simple"];

    if (program.canRenderGeometry()) {
      let id = Math.round(r * 255);

      // here: pick render function based on shader program
      program.renderGeometry(gl, geometry);

      // console.log(Math.round(r * 255));

      // 82
      // 122
      // 163
      // 204

      // pass color in
      gl.uniform3fv(program.uniforms.u_Color, [r, g, b]);
      gl.uniform1i(program.uniforms.u_Id, id);

      r += 0.16;
      g += 0.16;
      b += 0.16;

      continue;
    }
  }

  if (ctx.clicked) {
    if (ctx.lockPicking) return;
    ctx.clicked = false;

    // reset animation on click
    g_value = 0;
    g_startTime = null;

    //   read pixel color at mouse canvas position
    let pixel = new Uint8Array(4);
    gl.readPixels(ctx.canvas_mouse_x, ctx.canvas_mouse_y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    // let id = (pixel[0] << 24) | (pixel[1] << 16) | (pixel[2] << 8) | pixel[3];

    // get id from clicked pixel (id stored as r value)
    let id = pixel[0];
    console.log("selectd id: ", id);
    ctx.selectedID = id;

    // // if using id alone, id can sometimes be a negative value (sign bit used)
    // // doing this (below) makes it correct,
    // // for example: id=e5e5e5ff is correct here, without this it would be id=-1a1a1a01
    // // id.toString(16) is now the hex rgba color of hovered pixel
    // let idArray = new Uint8Array(pixel.buffer);
    // idArray.reverse(); // reverse the byte order to match the endianness of a 32-bit integer
    // let id = new Uint32Array(idArray.buffer)[0];

    // // console.log(
    // //   "hovering: " +
    // //     `pos=(${ctx.canvas_mouse_x},${ctx.canvas_mouse_y})` + // where the mouse currently is on screen
    // //     `id=${id.toString(16)} `
    // // );

    // let strId = id.toString(16);

    // if (strId === "e5e5e5ff") {
    //   console.log("Clicked Background!");
    // } else if (strId === "994c4cff") {
    //   console.log("Clicked Floor!");
    // } else if (strId === "803333ff") {
    //   console.log("Clicked Head!");
    // } else if (strId === "661919ff") {
    //   console.log("Clicked Column!");
    // } else if (strId === "4c0000ff") {
    //   console.log("Clicked Base!");
    // }

    // // lookup id
    // let node_clicked = context.id2node[id];
    // if (node_clicked) {
    //   if (node_clicked.onclick) {
    //     node_clicked.onclick(node_clicked);
    //   }
    // }
  }
}
/*
 * The render() function issues the draw calls
 * based on the current state of the model.
 */
function render(context) {
  let ctx = context;
  let gl = context.gl;

  render_pass_pick();

  if (!ctx.renderPickOnly) {
    render_pass_shadows(scene);
    render_pass_final(scene);
  }
}

/*
 * The step() function is called for each animation
 * step. Note that the time points are not necessarily
 * equidistant.
 */
function step(timestamp) {
  update(context, timestamp);
  render(context);
  window.requestAnimationFrame(step);
}

async function main() {
  await init(context);
  window.requestAnimationFrame(step);
}

// make main function available globally
window.main = main;
