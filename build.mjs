import fsPromise from 'node:fs/promises';
import pathFn from 'node:path';

import { rollup } from 'rollup';
import dts from 'rollup-plugin-dts';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import alias from '@rollup/plugin-alias';

const info = JSON.parse(await fsPromise.readFile('./package.json', 'utf-8'));
const { keywords, author, license, homepage, repository, bugs } = info;



const external = [/^@neeloong\//, 'vue'];
/** @type {Record<string, string>} */
const globals = {
	vue: 'Vue'
};
/** @param {string} name */
const nameReplacer = (name) => {
	if(name in globals) {
		return globals[name]
	}
	return name
	.replace(/[-/]([a-z])/g, (_, v) => v.toUpperCase())
	.replace(/@/g, '');
}

/** @param {string} name @param {string} version */
const createBanner = (name, version) => `\
/*!
* @neeloong/${name} v${version}
* (c) 2024-${new Date().getFullYear()} ${author}
* @license ${license}
*/
`;


console.log('移除 dist 目录...');
await fsPromise.rm('dist', { recursive: true }).catch(() => { });
console.log('创建 dist 目录...');
await fsPromise.mkdir(`dist`, { recursive: true });
// const dirs = await fsPromise.readdir('packages');
const dirs = ['']
const allItems = await Promise.all(dirs.map(async dir => {
	const info = JSON.parse(await fsPromise.readFile(`packages/${dir}/package.json`, 'utf-8'));
	const { name, version, description, keywords = [] } = info;
	return {dir, name, version, description, keywords}
}));


for (const {dir} of allItems) {
	console.log(`创建 dist/${dir} 目录...`);
	await fsPromise.mkdir(`dist/${dir}`, { recursive: true });
}

console.log('打包...');
for (const {dir, name, version} of allItems) {
	const banner = createBanner(dir, version);

	const bundle = await rollup({
		input: `packages/${dir}/index.mjs`, external, plugins: [
			replace({ preventAssignment: true, values: { __VERSION__: version } }),

			alias({
				entries: [
					{ find: 'signal-polyfill', replacement: pathFn.resolve('node_modules/signal-polyfill/dist/index.js') },
				]
			}),
		],
	});
	const umdName = nameReplacer(name)
	for (const ext of ['mjs', 'js','min.mjs', 'min.js']) {
		const format = ext.endsWith('mjs') ? 'esm' : 'umd';
		const output = `dist/${dir}/index.${ext}`;
		console.log(`  生成 ${output} ...`);
		const { output: [chunk] } = await bundle.generate({
			format, name: umdName, banner, globals: nameReplacer,
			plugins: ext.includes('min') ? [terser()] : [],
		});
		// @ts-ignore
		await fsPromise.writeFile(output, chunk.source || chunk.code || '');
	}

	const dtsInput = `typings/${dir}/index.types.d.mts`;
	const dtsOutput = `dist/${dir}/index.d.ts`
	console.log(`  生成 ${dtsOutput} ...`);
	const dtsBundle = await rollup({ input: dtsInput, external, plugins: [dts()] });
	const { output: [dtsChunk] } = await dtsBundle.generate({ format: 'esm', banner });
	// @ts-ignore
	await fsPromise.writeFile(dtsOutput, dtsChunk.source || dtsChunk.code || '');
}


for (const {dir, name, version, description, keywords: selfKeywords} of allItems) {
	console.log(`生成 dist/${dir}/package.json...`);
	await fsPromise.writeFile(`dist/${dir}/package.json`, JSON.stringify({
		name, version, description, keywords: [...keywords, ...selfKeywords],
		author, license, homepage, repository, bugs,
		module: 'index.mjs',
		main: 'index.js',
		unpkg: 'index.js',
		jsdelivr: 'index.js',
		types: './index.d.ts',
		exports: {
			'.': {
				types: './index.d.ts',
				node: './index.js',
				module: './index.mjs',
				unpkg: './index.js',
				jsdelivr: './index.js',
			},
		},
	}, null, 2));
}
