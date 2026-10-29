# Builds the eight pieces of kit for the Pitchside 3D drills in Blender, from clean shapes, at the size and the way round
# each one sits in the scene, and exports them as GLB (no textures: plain coloured materials, all opaque).
#   blender -b --factory-startup --python scripts/blender/build-kit.py -- public/models/kit [name ...]
# src/lib/kit-models.ts fits each model to its box without stretching it, so keep the boxes there in proportion with
# the sizes this prints. A kit change also needs the AR models and the AR page's moving cards rebuilt.
# Axes (Blender, Z up): X across the player, +Y towards the player's head, Z up. The glTF export turns this into the
# app's frame: x across, y up, z along the player with the head at -z.
import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
OUT = argv[0] if argv else "."
ONLY = set(argv[1:])
os.makedirs(OUT, exist_ok=True)


# ------------------------------------------------------------------ helpers
def lin(h):
    """sRGB hex to linear RGBA (Blender's colour inputs are linear)."""
    h = h.lstrip("#")
    c = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c) + (1.0,)


_mats = {}


def mat(name, hexcol, rough=0.55, metal=0.0):
    key = (name, hexcol, rough, metal)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = lin(hexcol)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    _mats[key] = m
    return m


def link(obj):
    bpy.context.scene.collection.objects.link(obj)
    return obj


def new_obj(name, bm, material):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(material)
    return link(bpy.data.objects.new(name, me))


def apply_mods(o):
    bpy.context.view_layer.objects.active = o
    for m in list(o.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)


def bevel(o, width, segments=3, limit="ANGLE"):
    m = o.modifiers.new("bevel", "BEVEL")
    m.width = width
    m.segments = segments
    m.limit_method = limit
    m.angle_limit = math.radians(35)
    m.harden_normals = False
    return m


def box(name, size, loc, material, round_=0.0, segments=3):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector(loc), verts=bm.verts)
    o = new_obj(name, bm, material)
    if round_ > 0:
        bevel(o, round_, segments)
        apply_mods(o)
    return o


def cylinder(name, r, depth, loc, material, axis="Z", verts=24, r2=None, cap=True):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=verts, radius1=r, radius2=r if r2 is None else r2, depth=depth)
    rot = {"Z": Matrix(), "X": Matrix.Rotation(math.pi / 2, 4, "Y"), "Y": Matrix.Rotation(math.pi / 2, 4, "X")}[axis]
    bmesh.ops.transform(bm, matrix=rot, verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector(loc), verts=bm.verts)
    return new_obj(name, bm, material)


def ellipsoid(name, radii, loc, material, segs=24, rings=14):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=rings, radius=1.0)
    bmesh.ops.scale(bm, vec=Vector(radii), verts=bm.verts)
    bmesh.ops.translate(bm, vec=Vector(loc), verts=bm.verts)
    return new_obj(name, bm, material)


def tube(name, points, radius, material, closed=False, bevel_res=4):
    """A round tube along a path of points (a curve, turned into a mesh)."""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = radius
    cu.bevel_resolution = bevel_res
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(points) - 1)
    for p, xyz in zip(sp.points, points):
        p.co = (*xyz, 1.0)
    sp.use_cyclic_u = closed
    o = link(bpy.data.objects.new(name, cu))
    o.data.materials.append(material)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.ops.object.convert(target="MESH")
    return bpy.context.view_layer.objects.active


def rounded_rect(w, d, r, n=6):
    """Points of a rounded rectangle (w across X, d along Y), centred, counter-clockwise."""
    pts = []
    for cx, cy, a0 in ((w / 2 - r, d / 2 - r, 0), (-w / 2 + r, d / 2 - r, 90), (-w / 2 + r, -d / 2 + r, 180), (w / 2 - r, -d / 2 + r, 270)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def prism(name, outline, z0, z1, material, holes=()):
    """An outline (list of (x, y)) extruded from z0 to z1, optionally with holes cut through (each an outline)."""
    bm = bmesh.new()
    verts = [bm.verts.new((x, y, z0)) for x, y in outline]
    face = bm.faces.new(verts)
    bmesh.ops.recalc_face_normals(bm, faces=[face])
    if face.normal.z > 0:
        face.normal_flip()
    ret = bmesh.ops.extrude_face_region(bm, geom=[face])
    top = [v for v in ret["geom"] if isinstance(v, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=Vector((0, 0, z1 - z0)), verts=top)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = new_obj(name, bm, material)
    for i, h in enumerate(holes):
        cutter = prism(f"{name}-cut{i}", h, z0 - 0.01, z1 + 0.01, material)
        boolean(o, cutter)
    return o


def boolean(o, cutter, op="DIFFERENCE"):
    m = o.modifiers.new("bool", "BOOLEAN")
    m.operation = op
    m.solver = "EXACT"
    m.object = cutter
    apply_mods(o)
    bpy.data.objects.remove(cutter, do_unlink=True)
    return o


def smooth(o, angle=40):
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(angle))
    # apply any "smooth by angle" modifier so the normals go out with the mesh
    apply_mods(o)


def finish(objs, name):
    """Join the parts into one object (one primitive per material in the GLB) with clean normals."""
    for o in objs:
        smooth(o)
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    o.name = name
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(o.data)
    bm.free()
    return o


def export(o, name):
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    path = os.path.join(OUT, f"{name}.glb")
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_texcoords=False,
        export_normals=True,
        export_materials="EXPORT",
        export_animations=False,
        export_extras=False,
    )
    tris = sum(len(p.vertices) - 2 for p in o.data.polygons)
    lo = Vector(map(min, *[o.matrix_world @ v.co for v in o.data.vertices]))
    hi = Vector(map(max, *[o.matrix_world @ v.co for v in o.data.vertices]))
    s = hi - lo
    # sizes in the app's frame: x across, y up, z along
    print(f"[kit] {name}: {tris} triangles, {len(o.data.materials)} materials, size x {s.x:.3f} y {s.z:.3f} z {s.y:.3f} -> {path}")


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()


# ------------------------------------------------------------------ colours
YELLOW = "#F2C811"
NAVY = "#22406e"
ORANGE = "#E36B12"
WHITE_SHELL = "#ECE6D6"
DARK = "#2B2F36"
BLACK = "#16181c"
STEEL = "#9AA3AD"
CHROME = "#C9CED4"
SCREEN = "#0F2236"
REFLECT = "#D9DEE5"


# ------------------------------------------------------------------ the kit
def build_aed():
    """A training AED lying flat: rounded yellow case, dark control panel with a screen, the orange shock button with
    its lightning stripe, a green on/off button, the carry handle at the back and the pads socket at the side."""
    case = mat("aed-case", YELLOW, 0.45)
    panel = mat("aed-panel", DARK, 0.6)
    screen = mat("aed-screen", SCREEN, 0.2)
    shock = mat("aed-shock", "#E8502A", 0.35)
    bolt = mat("aed-bolt", "#FFE45C", 0.4)
    on = mat("aed-on", "#2E9E55", 0.35)
    parts = [
        box("case", (0.30, 0.24, 0.075), (0, 0, 0.0375), case, round_=0.022),
        box("panel", (0.25, 0.17, 0.008), (-0.005, 0.0, 0.077), panel, round_=0.006),
        box("screen", (0.085, 0.06, 0.006), (-0.06, 0.035, 0.0825), screen, round_=0.004),
        cylinder("shock", 0.032, 0.012, (0.045, -0.02, 0.083), shock, verts=28),
        box("handle-l", (0.022, 0.03, 0.045), (0.125, 0.075, 0.095), case, round_=0.008),
        box("handle-r", (0.022, 0.03, 0.045), (0.125, -0.075, 0.095), case, round_=0.008),
        box("handle-bar", (0.026, 0.18, 0.024), (0.125, 0, 0.118), case, round_=0.01),
        cylinder("on", 0.012, 0.01, (-0.075, -0.045, 0.083), on, verts=20),
        box("socket", (0.04, 0.012, 0.03), (-0.09, -0.124, 0.04), panel, round_=0.004),
    ]
    # the lightning stripe on the shock button
    bolt_pts = [(0.006, 0.022), (-0.012, -0.002), (-0.001, -0.002), (-0.007, -0.022), (0.013, 0.004), (0.002, 0.004)]
    parts.append(prism("bolt", [(0.045 + x, -0.02 + y) for x, y in bolt_pts], 0.088, 0.0905, bolt))
    return finish(parts, "aed")


def build_bag():
    """The emergency bag: a navy soft bag with rounded edges, a zip round the lid, two carry handles, a reflective band,
    end pockets and a white cross on each long side."""
    body = mat("bag-body", NAVY, 0.8)
    trim = mat("bag-trim", "#162a49", 0.85)
    band = mat("bag-band", REFLECT, 0.3, 0.2)
    cross = mat("bag-cross", "#F4F4F1", 0.6)
    w, d, h = 0.60, 0.40, 0.34
    parts = [
        box("body", (w, d, h), (0, 0, h / 2), body, round_=0.045, segments=4),
        box("base", (w + 0.006, d + 0.006, 0.03), (0, 0, 0.015), trim, round_=0.012),
        box("zip", (w - 0.04, d - 0.04, 0.012), (0, 0, h - 0.004), trim, round_=0.01),
        box("pocket-l", (0.03, d * 0.62, h * 0.56), (w / 2 + 0.012, 0, h * 0.4), trim, round_=0.012),
        box("pocket-r", (0.03, d * 0.62, h * 0.56), (-w / 2 - 0.012, 0, h * 0.4), trim, round_=0.012),
    ]
    # the reflective band, just proud of the sides
    for sy in (1, -1):
        parts.append(box(f"band-{sy}", (w - 0.08, 0.004, 0.028), (0, sy * (d / 2 + 0.0015), h * 0.58), band))
    for sx in (1, -1):
        parts.append(box(f"band-e{sx}", (0.004, d - 0.08, 0.028), (sx * (w / 2 + 0.0015), 0, h * 0.58), band))
    # a white cross on each long side
    for sy in (1, -1):
        y = sy * (d / 2 + 0.003)
        parts.append(box(f"cross-v{sy}", (0.035, 0.004, 0.10), (0.16, y, h * 0.36), cross))
        parts.append(box(f"cross-h{sy}", (0.10, 0.004, 0.035), (0.16, y, h * 0.36), cross))
    # two carry handles over the top, along the bag
    for sy in (0.07, -0.07):
        pts = [(-0.17, sy, h - 0.01), (-0.15, sy, h + 0.07), (-0.08, sy, h + 0.115), (0.08, sy, h + 0.115), (0.15, sy, h + 0.07), (0.17, sy, h - 0.01)]
        parts.append(tube(f"handle{sy}", pts, 0.012, trim))
    return finish(parts, "bag")


def build_oxygen():
    """A medical oxygen cylinder lying down, the valve towards the head (+Y): white body with a darker label band, the
    shoulder, a chrome valve with the black handwheel, a regulator with its pressure gauge and flow knob, and a guard."""
    body = mat("o2-body", "#EEF1F3", 0.35, 0.1)
    label = mat("o2-label", "#3C8F5A", 0.5)
    metal = mat("o2-valve", CHROME, 0.25, 0.85)
    black = mat("o2-black", BLACK, 0.5)
    gauge = mat("o2-gauge", "#F7F7F2", 0.3)
    r = 0.085
    L = 0.46
    v = L / 2 + 0.07  # where the valve sits, just past the shoulder
    parts = [
        cylinder("body", r, L, (0, 0, 0), body, axis="Y", verts=32),
        ellipsoid("foot", (r, 0.045, r), (0, -L / 2, 0), body, segs=32, rings=12),
        ellipsoid("shoulder", (r, 0.07, r), (0, L / 2, 0), body, segs=32, rings=12),
        cylinder("label", r + 0.002, 0.10, (0, -0.05, 0), label, axis="Y", verts=32),
        cylinder("neck", 0.026, 0.04, (0, v, 0), metal, axis="Y", verts=20),
        # the valve block with the handwheel on top, then the regulator: its gauge faces up, the flow knob on the side
        box("valve", (0.06, 0.06, 0.06), (0, v + 0.045, 0), metal, round_=0.01),
        cylinder("wheel", 0.034, 0.016, (0, v + 0.045, 0.04), black, axis="Z", verts=24),
        box("regulator", (0.05, 0.07, 0.05), (0, v + 0.11, 0), metal, round_=0.012),
        cylinder("gauge", 0.03, 0.02, (0, v + 0.105, 0.035), metal, axis="Z", verts=28),
        cylinder("gauge-face", 0.025, 0.004, (0, v + 0.105, 0.046), gauge, axis="Z", verts=28),
        cylinder("needle", 0.003, 0.002, (0.008, v + 0.11, 0.049), black, axis="Z", verts=8),
        cylinder("flow", 0.02, 0.024, (0.038, v + 0.12, 0), mat("o2-flow", "#2E9E55", 0.4), axis="X", verts=20),
        cylinder("outlet", 0.007, 0.035, (0, v + 0.16, 0), metal, axis="Y", verts=12),
    ]
    # the carry guard round the valve
    parts.append(tube("guard", [(-0.065, v - 0.03, -0.01), (-0.065, v + 0.17, -0.01), (0.065, v + 0.17, -0.01), (0.065, v - 0.03, -0.01)], 0.008, mat("o2-guard", STEEL, 0.4, 0.6)))
    return finish(parts, "oxygen")


def build_bvm():
    """The adult bag valve for the i-gel (no face mask: in the drill the i-gel is in): the self-inflating bag along Z,
    the patient valve at the top with its 22 mm port straight on (a catheter mount in the scene runs from it to the
    i-gel), the oxygen inlet and the reservoir bag at the bottom. The scene lays it across behind the head, so +X is
    up there and -Y faces the player: the outlet of the expiratory valve looks up and the oxygen nipple towards the
    player, so squeezing the bag flat (along X) moves neither end."""
    bagm = mat("bvm-bag", "#BFD9E6", 0.45)
    valve = mat("bvm-valve", "#3A79B8", 0.35)
    clear = mat("bvm-clear", "#E4EEF2", 0.25)
    resv = mat("bvm-reservoir", "#A9D8B8", 0.5)
    parts = [
        # about 12 x 26 cm, an adult bag
        ellipsoid("bag", (0.06, 0.06, 0.13), (0, 0, 0), bagm, segs=32, rings=20),
        cylinder("neck", 0.022, 0.03, (0, 0, 0.14), valve, verts=20),
        cylinder("valve", 0.026, 0.04, (0, 0, 0.175), valve, verts=24),
        cylinder("outlet", 0.012, 0.02, (0.032, 0, 0.18), clear, axis="X", verts=16),
        cylinder("port", 0.011, 0.025, (0, 0, 0.2075), clear, verts=18),
        cylinder("tail", 0.02, 0.03, (0, 0, -0.14), valve, verts=18),
        cylinder("inlet", 0.022, 0.035, (0, 0, -0.17), valve, verts=20),
        cylinder("nipple", 0.005, 0.03, (0, -0.035, -0.17), clear, axis="Y", verts=12),
        ellipsoid("reservoir", (0.05, 0.045, 0.09), (0, 0, -0.278), resv, segs=24, rings=14),
    ]
    return finish(parts, "bvm")


def build_scoop():
    """An orthopaedic scoop: two blades that split along the length, each a yellow plate with lightening slots and a
    raised outer rail, joined by grey latches at the head and foot ends (narrower at the feet, as real scoops are)."""
    blade = mat("scoop-blade", YELLOW, 0.5)
    rail = mat("scoop-rail", "#D8AC0C", 0.45)
    latch = mat("scoop-latch", "#6B7480", 0.4, 0.5)
    L, gap = 1.88, 0.026
    seam = mat("scoop-seam", DARK, 0.6)
    parts = [box("seam", (gap * 0.8, L - 0.12, 0.006), (0, 0, 0.004), seam)]
    for sx in (1, -1):
        # the outline of one blade: wider at the head (+Y) than at the feet (-Y)
        outer_head, outer_foot, inner = 0.30, 0.25, gap / 2
        outline = [(sx * inner, -L / 2), (sx * outer_foot, -L / 2), (sx * outer_head, L / 2 - 0.10), (sx * (outer_head - 0.05), L / 2), (sx * inner, L / 2)]
        if sx < 0:
            outline = list(reversed(outline))
        slots = []
        for i in range(6):
            y0 = -L / 2 + 0.16 + i * 0.27
            xa, xb = sx * 0.06, sx * 0.19
            lo_x, hi_x = min(xa, xb), max(xa, xb)
            slots.append([(lo_x, y0), (hi_x, y0), (hi_x, y0 + 0.19), (lo_x, y0 + 0.19)])
        parts.append(prism(f"blade{sx}", outline, 0.0, 0.018, blade, holes=slots))
        rail_pts = [(sx * (outer_foot - 0.012), -L / 2 + 0.02, 0.03), (sx * (outer_head - 0.012), L / 2 - 0.11, 0.03), (sx * (outer_head - 0.06), L / 2 - 0.02, 0.03)]
        parts.append(tube(f"rail{sx}", rail_pts, 0.016, rail))
    parts.append(box("latch-head", (0.26, 0.07, 0.05), (0, L / 2 - 0.05, 0.025), latch, round_=0.012))
    parts.append(box("latch-foot", (0.22, 0.07, 0.05), (0, -L / 2 + 0.05, 0.025), latch, round_=0.012))
    # the release buttons where the two halves lock together
    for y in (L / 2 - 0.05, -L / 2 + 0.05):
        parts.append(cylinder(f"button{y}", 0.014, 0.012, (0, y, 0.054), mat("scoop-button", "#C0392B", 0.4), verts=16))
    return finish(parts, "scoop")


def build_board():
    """A long spine board: a yellow plastic board with rounded corners, the handholds in a row along each edge and at
    the ends, and a slightly narrower foot end."""
    board = mat("board", "#F2B705", 0.5)
    L, W, T = 1.84, 0.46, 0.05
    outline = [(-W / 2, -L / 2 + 0.06), (-W / 2 + 0.06, -L / 2), (W / 2 - 0.06, -L / 2), (W / 2, -L / 2 + 0.06), (W / 2, L / 2 - 0.08), (W / 2 - 0.08, L / 2), (-W / 2 + 0.08, L / 2), (-W / 2, L / 2 - 0.08)]
    holes = []
    for sx in (1, -1):
        for i in range(6):
            y0 = -L / 2 + 0.17 + i * 0.27
            x0, x1 = sx * (W / 2 - 0.03), sx * (W / 2 - 0.085)
            holes.append([(min(x0, x1), y0), (max(x0, x1), y0), (max(x0, x1), y0 + 0.14), (min(x0, x1), y0 + 0.14)])
    for sy in (1, -1):
        y0, y1 = sy * (L / 2 - 0.03), sy * (L / 2 - 0.085)
        holes.append([(-0.1, min(y0, y1)), (0.1, min(y0, y1)), (0.1, max(y0, y1)), (-0.1, max(y0, y1))])
    b = prism("board", outline, 0.0, T, board, holes=holes)
    bevel(b, 0.008, 2)
    apply_mods(b)
    parts = [b]
    # strap pins between the handholds
    pin = mat("board-pin", DARK, 0.5, 0.3)
    for sx in (1, -1):
        for i in range(5):
            parts.append(cylinder(f"pin{sx}{i}", 0.011, 0.012, (sx * (W / 2 - 0.058), -L / 2 + 0.375 + i * 0.27, T + 0.004), pin, verts=14))
    return finish(parts, "board")


def build_basket():
    """A basket stretcher: an orange plastic tray with low walls and rounded corners, a grey tubular rail round the top
    edge with handholds, and three dark straps across."""
    shell = mat("basket-shell", ORANGE, 0.55)
    railm = mat("basket-rail", STEEL, 0.35, 0.7)
    strap = mat("basket-strap", BLACK, 0.7)
    L, W, H, t = 2.06, 0.66, 0.17, 0.018
    outer = prism("outer", rounded_rect(W, L, 0.12), 0.0, H, shell)
    inner = prism("inner", rounded_rect(W - 2 * t, L - 2 * t, 0.12 - t), t, H + 0.05, shell)
    tray = boolean(outer, inner)
    pts = [(x, y, H + 0.02) for x, y in rounded_rect(W + 0.02, L + 0.02, 0.13)]
    parts = [tray, tube("rail", pts, 0.012, railm, closed=True)]
    # posts from the wall up to the rail
    for x, y in ((W / 2, 0.5), (W / 2, -0.5), (-W / 2, 0.5), (-W / 2, -0.5), (W / 2, 0), (-W / 2, 0)):
        parts.append(cylinder(f"post{x}{y}", 0.008, 0.03, (x + (0.01 if x > 0 else -0.01), y, H + 0.005), railm, verts=10))
    for y in (0.55, 0.0, -0.55):
        parts.append(box(f"strap{y}", (W - 0.04, 0.05, 0.006), (0, y, H * 0.62), strap))
    return finish(parts, "basket")


def build_collar():
    """An extrication collar round the neck (the axis is Y, the head towards +Y) for a player lying on the back: the
    front shell on top with the chin support reaching towards the head, the airway opening, the back panel underneath,
    dark padding at the chin, and the strap at the side."""
    shell = mat("collar-shell", WHITE_SHELL, 0.6)
    pad = mat("collar-pad", DARK, 0.7)
    strap = mat("collar-strap", BLACK, 0.7)
    rx, rz, t, length = 0.098, 0.08, 0.014, 0.085

    def ring(name, rx_, rz_, y0, y1, m_, a0=0, a1=360):
        pts = []
        n = 40
        for i in range(n + 1):
            a = math.radians(a0 + (a1 - a0) * i / n)
            pts.append((rx_ * math.cos(a), rz_ * math.sin(a)))
        inner = [(x * (rx_ - t) / rx_, z * (rz_ - t) / rz_) for x, z in reversed(pts)]
        outline = pts + inner
        # build in the XZ plane, extrude along Y
        bm = bmesh.new()
        vs = [bm.verts.new((x, y0, z)) for x, z in outline]
        f = bm.faces.new(vs)
        ret = bmesh.ops.extrude_face_region(bm, geom=[f])
        top = [v for v in ret["geom"] if isinstance(v, bmesh.types.BMVert)]
        bmesh.ops.translate(bm, vec=Vector((0, y1 - y0, 0)), verts=top)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        return new_obj(name, bm, m_)

    parts = [
        # the back panel: the lower half, under the neck
        ring("back", rx, rz, -length / 2, length / 2, shell, 180, 360),
        # the front shell: the upper half, just outside the back panel
        ring("front", rx + 0.004, rz + 0.004, -length / 2 - 0.004, length / 2, shell, 0, 180),
        # the chin cup: the front shell's upper rim flares out towards the head
        ring("chin-cup", rx + 0.012, rz + 0.012, length / 2 - 0.002, length / 2 + 0.034, shell, 22, 158),
        # padding inside the chin cup
        ring("chin-pad", rx + 0.0, rz + 0.0, length / 2 + 0.004, length / 2 + 0.03, pad, 30, 150),
        # the hook-and-loop strap round one side
        ring("strap", rx + 0.01, rz + 0.01, -0.022, 0.022, strap, -28, 28),
    ]
    # the airway opening in the front shell
    hole = cylinder("hole", 0.032, 0.08, (0, -0.004, rz), shell, axis="Z", verts=24)
    boolean(parts[1], hole)
    return finish(parts, "collar")


BUILDERS = {
    "aed": build_aed,
    "bag": build_bag,
    "oxygen": build_oxygen,
    "bvm": build_bvm,
    "scoop": build_scoop,
    "board": build_board,
    "basket": build_basket,
    "collar": build_collar,
}

for name, build in BUILDERS.items():
    if ONLY and name not in ONLY:
        continue
    reset()
    o = build()
    export(o, name)
