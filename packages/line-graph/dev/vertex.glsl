// an attribute will receive data from a buffer
attribute vec4 a_position;

uniform vec2 u_resolution;

void main() {
    // convert the position from pixels to 0.0 to 1.0
    vec2 zero_to_one = a_position.xy / u_resolution;

    // convert from 0->1 to 0->2
    vec2 zero_to_two = zero_to_one * 2.0;

    // convert from 0->2 to -1->+1 (clipspace)
    vec2 clip_space = zero_to_two - 1.0;

    gl_Position = vec4(clip_space * vec2(1, -1), 0, 1);
}
