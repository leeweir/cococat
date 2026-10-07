import { group, box, ball, cyl, torus, star, flower, sign } from "./world.js";
import { TREASURES } from "./state.js";

// Fixed wall shelf: no new navigation obstacles and no user-controlled placement coordinates.
export function createTreasureDisplay(parent, ids) {
  const root = group(parent, [0.55, 2.48, -2.67]);
  box(root, 0xc99f72, [0, 0, 0], [2.3, 0.09, 0.43], 0.02);
  ids.slice(0, 3).forEach((id, i) => {
    const item = TREASURES.find((t) => t.id === id);
    if (!item) return;
    const p = group(root, [(i - 1) * 0.72, 0.08, 0]);
    p.userData.treasure = id;
    if (["leaf", "clover", "flower"].includes(id)) {
      if (id === "flower") flower(p, 0, 0.2, 0, 0xb3a8cd).scale.setScalar(0.45);
      else
        for (let n = 0; n < (id === "clover" ? 4 : 2); n++) {
          const leaf = ball(
            p,
            0x90ab77,
            [Math.cos(n * 1.57) * 0.07, 0.15 + Math.sin(n * 1.57) * 0.06, 0],
            [0.1, 0.065, 0.025],
          );
          leaf.rotation.z = n * 1.57;
        }
    } else if (id === "bell") {
      cyl(p, 0xe6c375, [0, 0.14, 0], 0.07, 0.14, 0.19);
      ball(p, 0xb7975a, [0, 0.02, 0], [0.04, 0.04, 0.04]);
    } else if (id === "feather") {
      const f = ball(p, 0x92b8cd, [0, 0.2, 0], [0.07, 0.2, 0.025]);
      f.rotation.z = -0.3;
    } else if (id === "acorn") {
      ball(p, 0xb99169, [0, 0.13, 0], [0.1, 0.13, 0.09]);
      cyl(p, 0x8c7459, [0, 0.23, 0], 0.08, 0.12, 0.08);
    } else if (id === "stone") star(p, 0xe9ce84, [0, 0.19, 0], 0.18);
    else if (id === "ribbon") {
      for (const side of [-1, 1]) {
        const loop = ball(
          p,
          0xd7a3b5,
          [side * 0.09, 0.18, 0],
          [0.11, 0.08, 0.035],
        );
        loop.rotation.z = side * 0.3;
      }
      ball(p, 0xbc8497, [0, 0.18, 0.02], [0.045, 0.045, 0.04]);
    } else if (id === "postcard") {
      const card = box(p, 0xfff4dc, [0, 0.17, 0], [0.3, 0.24, 0.035], 0.01);
      card.rotation.z = 0.15;
    } else if (id === "shell") {
      for (let n = 0; n < 5; n++) {
        const rib = ball(
          p,
          0xd9b7a2,
          [(n - 2) * 0.035, 0.14, 0],
          [0.045, 0.14, 0.045],
        );
        rib.rotation.z = -(n - 2) * 0.22;
      }
    } else if (id === "key") {
      torus(p, 0xc8b274, [0, 0.23, 0], 0.07, 0.025, [0, 0, 0]);
      box(p, 0xc8b274, [0, 0.1, 0], [0.035, 0.15, 0.035], 0.006);
      box(p, 0xc8b274, [0.035, 0.04, 0], [0.08, 0.03, 0.035], 0.006);
    } else {
      const button = cyl(p, 0x91afc5, [0, 0.15, 0], 0.12, 0.12, 0.04);
      button.rotation.x = Math.PI / 2;
    }
    sign(p, item.name, [0, -0.09, 0.24], 0.62, 0.16, "#fff4dc", "#695845");
  });
  return root;
}
