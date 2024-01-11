export {}

declare module "solid-js" {
	namespace JSX {
		interface CustomEvents extends HTMLElementEventMap {}
	}
}
