import * as fs from 'fs'

import {test, expect} from '@jest/globals'
import {PluginItem, transform, TransformOptions} from '@babel/core'

import preset from '.'

const NON_TEST_ENVIRONMENTS = [
  'development',
  'production',
  'esm',
  'cjs',
  'development-modern',
  'production-modern',
]

expect.addSnapshotSerializer({
  test: (val: unknown) => typeof val === 'string',
  print: (val: string) => val,
})

function macro(
  title: string,
  fixture: string,
  presetOptions = {},
  macroOptions = {
    environments: NON_TEST_ENVIRONMENTS,
  }
): void {
  test(`${title} given ${JSON.stringify(presetOptions)}`, () => {
    const file = `${__dirname}/fixtures/${fixture}`
    const input = fs.readFileSync(file, 'utf8')
    expect(input).toMatchSnapshot('input')

    const resolvedPresetOptions = {
      ...presetOptions,
      configPath: `${__dirname}/fixtures`,
    }

    const {environments} = macroOptions
    environments.forEach((envName) => {
      const presets: PluginItem[] = [[preset, resolvedPresetOptions]]
      const options: TransformOptions = {
        envName,
        presets,
        filename: `/${fixture}`,
        babelrc: false,
      }
      const result = transform(input, options)
      expect(result?.code).toMatchSnapshot(`output (${envName})`)
    })
  })
}

macro('transpiles ES2020+ syntax', 'syntax.js')
macro('transpiles ES2020+ syntax', 'syntax.js', {targets: 'last 2 Chrome versions'})
macro('transpiles ES2020+ syntax', 'syntax.js', {loose: false})
macro('transpiles ES2020+ syntax', 'syntax.js', {runtime: false})
macro('transpiles ES2020+ syntax', 'syntax.js', {loose: false, runtime: false})
macro('transpiles ES2020+ syntax', 'syntax.js', {modules: 'commonjs'})

macro('transpiles React', 'react.js')
macro('transpiles React with classic runtime', 'react-classic.js', {react: {runtime: 'classic'}})
macro('transpiles TSX', 'typescript.tsx')
macro('transpiles Emotion', 'emotion.js', {emotion: true})
macro('transpiles Emotion with classic runtime', 'emotion-classic.js', {
  emotion: true,
  react: {runtime: 'classic'},
})

macro('replaces generic polyfill with env-targeted polyfills', 'polyfills.js')

macro('transpiles ESM in node_modules', 'vendor/node_modules/my-pkg/index.js')
macro('transpiles CJS in node_modules', 'vendor/node_modules/my-pkg/cjs.js')
macro('avoids transpiling known precompiled packages', 'vendor/node_modules/react/index.js')

// the test environment targets the currently running version of Node by default
// since our CI tests multiple Node versions, we need to override this behavior
macro(
  'transpiles test env',
  'syntax.js',
  {targets: {node: '14.14', browsers: []}},
  {environments: ['test']}
)
