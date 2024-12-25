import LayoutNode from './LayoutNode.mjs'
function parse(xml) {
	const list = LayoutNode.parse(xml);
	console.info(list)
}

console.log(parse(`
	<child is="66" x @a=d @sss = 456 aa "dsds" :a=1 !x=sd a s d f g h asd ad sa ds>test</child>&#09;11
	<chLld :a="a">
		<child is="66" a>test</child>&#09;11
		<chLld :a="a"></chLld>
		<child/>
	</chLld>
	<child/>
`))
