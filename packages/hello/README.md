<a href="https://github.com/Damian Tarnawski/sorce/tree/main/packages/hello#readme">
<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=sorce&background=tiles&project=Hello" alt="sorce Hello">
</p>

# Hello

Example hello world package in the sorce repository.

## Installation

```bash
npm install @sorce/hello
# or
yarn add @sorce/hello
# or
pnpm add @sorce/hello
```

## How to use it

```ts
import { createHello } from '@sorce/hello'

const [hello, setHello] = createHello()

hello() // => "Hello World!"

setHello('Solid')

hello() // => "Hello Solid!"
```

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
