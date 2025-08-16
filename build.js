import esbuild from 'esbuild'
import youfile from 'youfile'
import { join } from 'path'

const _dist = 'dist'
const _package = 'package.json'
const _externals = ['LICENSE', 'README.md', 'types']

function buildScript(format) {
  esbuild.build({
    entryPoints: ['src/main.js'],
    bundle: true,
    minify: true,
    target: 'es2015',
    outfile: `${_dist}/lib/${format}.${format === 'cjs' ? 'cjs' : 'js'}`,
    platform: 'neutral',
    format
  })
}

function buildPackage() {
  const packageJson = youfile.read.json5Sync(_package)
  delete packageJson.devDependencies
  youfile.write.json(`${_dist}/package.json`, packageJson)
}

function copyExternals() {
  for (const path of _externals) {
    if (youfile.existsSync(path)) {
      youfile.copySync(path, join(_dist, path))
    }
  }
}

youfile.removeExistsSync(_dist)

buildScript('esm')
buildScript('cjs')
copyExternals()
buildPackage()
