uniform vec2 u_resolution;

// an attribute will receive data from a buffer
attribute vec2 a_position;
attribute vec4 a_color;

varying vec4 v_color;

void main() {
    // from pixels to 0->1 then to 0->2 then to -1->+1 (clipspace)
    vec2 clip_space = (a_position / u_resolution) * 2.0 - 1.0;

    gl_Position = vec4(clip_space * vec2(1, 1), 0, 1);
    gl_PointSize = 10.0;

    v_color = a_color;
}
