# CG Final Hunter Kalinoski

To run the project,

run `npm i` in the root directory to install dependencies (express),

then, do `npm run start` to start the server.

Finally, visit localhost:3000 in your browser to view it.

---

- I used lab10 as a template.

- I added a u_Color uniform to the vertex shader,
  and a v_Color varying to the vertex and fragment shaders
  of the shadow shaders you had created.

- In scene_illumination.js, I loaded the three meshes for the pawn model.
  Each mesh also has a HD version, which can be toggled by using lines 90-92 over 85-87.
  Each mesh had its own program.
  This was useful so I could set different rendering procedures for each,
  allowing me to easily translate the bottom downwards, and the top upwards.
  The code for each rendering procedure is similar to your shadow procedure,
  but includes setting color, and applying the translations. (lab10.js 616-801).

- I also modified the simple shader procedure that you had to accept my meshes.
  I had to change from using the array_buffer to element_array_buffer,
  because of the way gltf stores the vertices (indices). (lab10.js 803-823).

- The new simple shader procedure was used to implement picking. (lab10.js 990-1090)
  The picking pass works similar to the one you implemented in a previous lab.
  I modified it slightly to fit with the newer code, and to render in red-scale.

- There are hotkey bindings to accept 'r', 'l', and 'a'.
  'r' toggles rendering the shadow passes or not.
  'l' locks the picking functionality, so clicking does not change your selection.
  'a' switches animation mode of the transition animation
  between linear, ease-in-out and ease-in-out-cubic.

- To achieve the transition animation, I used a global variable to represent the distance each mesh should move. (lab10.js 454-509)
  When a click is registered on one of my meshes, the variable increments from 0 to 2 over one second.
  The translation is applied to the meshes in their individual rendering procedures (ex. lab10.js 763 - 767).
  This way, changing the global variable moves each mesh.

- The animation for color works in a similar way. (lab10.js 519 - 610).
  It randomly chooses a new color from a hard-coded list, and interpolates from current color to that over 1.5s.
  It then stays at that color for 3s before choosing a new color and repeating.
  Since the rgb values that are being animated are not 0-1 range, like the translation value was,
  an explicit lerp function was required to normalize the 0-1 progress float to a value between prev and next color.

I hope you like my project! This class was fun and I learned a lot, especially while coding for this project.

Have a good summer!
