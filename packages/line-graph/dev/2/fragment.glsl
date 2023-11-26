precision mediump float;

varying vec4 v_color;

void main() {
  // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  gl_FragColor = v_color;
}
