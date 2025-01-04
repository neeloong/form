import fsPromise from 'node:fs/promises';
import pathFn from 'node:path';

import { rollup } from 'rollup';
import dts from 'rollup-plugin-dts';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import alias from '@rollup/plugin-alias';

const info = JSON.parse(await fsPromise.readFile('./package.json', 'utf-8'));
const { name, version, description, keywords, author, license, homepage, repository, bugs } = info;



const external = ['signal-polyfill'];

const banner = `\
/*!
* ${name} v${version}
* (c) 2024-${new Date().getFullYear()} ${author}
* @license ${license}
*/
`;


console.log('移除 dist 目录...');
await fsPromise.rm('dist', { recursive: true }).catch(() => { });
console.log('创建 dist 目录...');
await fsPromise.mkdir(`dist`, { recursive: true });



console.log('打包...');

const umdName = name
	.replace(/[-/]([a-z])/g, (_, v) => v.toUpperCase())
	.replace(/@/g, '');


const bundle = await rollup({
	input: `src/index.mjs`, external, plugins: [
		replace({ preventAssignment: true, values: { __VERSION__: version } }),
	],
});
for (const ext of ['mjs']) {
	const format = 'esm';
	const output = `dist/index.${ext}`;
	console.log(`  生成 ${output} ...`);
	const { output: [chunk] } = await bundle.generate({
		format, name: umdName, banner,
	});
	// @ts-ignore
	await fsPromise.writeFile(output, chunk.source || chunk.code || '');
}


const bundle2 = await rollup({
	input: `src/index.mjs`, plugins: [
		replace({ preventAssignment: true, values: { __VERSION__: version } }),
		alias({
			entries: [
				{ find: 'signal-polyfill', replacement: pathFn.resolve('node_modules/signal-polyfill/dist/index.js') },
			]
		}),
	],
});
for (const ext of ['js','min.mjs', 'min.js']) {
	const format = ext.endsWith('mjs') ? 'esm' : 'umd';
	const output = `dist/index.${ext}`;
	console.log(`  生成 ${output} ...`);
	const { output: [chunk] } = await bundle2.generate({
		format, name: umdName, banner,
		plugins: ext.includes('min') ? [terser()] : [],
	});
	// @ts-ignore
	await fsPromise.writeFile(output, chunk.source || chunk.code || '');
}

const dtsInput = `typings/index.types.d.mts`;
const dtsOutput = `dist/index.d.mts`
console.log(`  生成 ${dtsOutput} ...`);
const dtsBundle = await rollup({ input: dtsInput, external, plugins: [dts()] });
const { output: [dtsChunk] } = await dtsBundle.generate({ format: 'esm', banner });
// @ts-ignore
await fsPromise.writeFile(dtsOutput, dtsChunk.source || dtsChunk.code || '');


console.log(`生成 dist/package.json...`);
await fsPromise.writeFile(`dist/package.json`, JSON.stringify({
	name, version, description, keywords,
	author, license, homepage, repository, bugs,
	type: 'module',
	main: 'index.mjs',
	unpkg: 'index.min.js',
	jsdelivr: 'index.min.js',
	types: './index.d.mts',
	exports: {
		'.': {
			types: './index.d.mts',
			main: './index.mjs',
			module: './index.mjs',
			unpkg: './index.min.js',
			jsdelivr: './index.min.js',
		},
	},
}, null, 2));
