#define PI 3.1415926535897932384626433832795

uniform vec2 u_resolution;
uniform float u_thickness;

// an attribute will receive data from a buffer
attribute vec2 a_position;
attribute float a_angle;
attribute vec4 a_color;

varying vec4 v_color;

void main() {
    // move a_position by thickness in the direction of a_angle
    vec2 p = a_position + vec2(cos(a_angle), sin(a_angle)) * u_thickness / 2.0;

    // from pixels to 0->1 then to 0->2 then to -1->+1 (clipspace)
    vec2 clip_space = (p / u_resolution) * 2.0 - 1.0;

    gl_Position = vec4(clip_space * vec2(1, 1), 0, 1);
    gl_PointSize = u_thickness;

    v_color = a_color;
}
