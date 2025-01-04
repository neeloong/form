import fsPromises from 'node:fs/promises';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';

const {
	name,  version, description, keywords, engines, dependencies,
	author, license, homepage, repository, bugs,
} = JSON.parse(await fsPromises.readFile('./package.json', 'utf-8'));


const banner = `\
/*!
 * ${ name } v${ version }
 * (c) 2024-${ new Date().getFullYear() } ${ author }
 * @license ${ license }
 */
`;

const outputFile = 'form';
await fsPromises.writeFile('dist/package.json', JSON.stringify({
	name, version,
	main: `index.cjs`,
	types: `index.d.ts`,
	module: `index.mjs`,
	browser: `index.min.js`,
	unpkg: `index.js`,
	jsdelivr: `index.js`,
	dependencies, engines,
	description, keywords, author, license, homepage, repository, bugs,
	exports: {
		'.': {
			node: `./index.cjs`,
			types: `./index.d.ts`,
			module: `./index.mjs`,
			browser: `./index.min.js`,
			unpkg: `./index.js`,
			jsdelivr: `./index.js`,
		},
		'./package.json': './package.json',
	},
}, null, 2));
const input = 'src/index.mjs';

const types = await fsPromises.readFile('src/types.mts', 'utf-8');


await fsPromises.writeFile(
	`dist/index.d.ts`,
	banner + types.replaceAll('__VERSION__', version)
);
await fsPromises.copyFile('README.md', 'dist/README.md');
await fsPromises.copyFile('LICENSE', 'dist/LICENSE');
export default {
	input,
	output: [
		{ format: 'cjs', file: `dist/index.cjs` },
		{ format: 'esm', file: `dist/index.mjs` },
		{ format: 'esm', file: `dist/index.min.mjs`, plugins: [terser()] },
		{ format: 'umd', file: `dist/index.js` },
		{ format: 'umd', file: `dist/index.min.js`,  plugins: [terser()] },
	].map(v => ({banner, exports: 'default', name: 'neeloongForm', ...v})),
	plugins: [
		replace({
			preventAssignment: true,
			values:{__VERSION__: version,
			},
		}),
	],
};
