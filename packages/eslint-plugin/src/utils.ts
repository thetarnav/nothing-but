import * as eslint from "@typescript-eslint/utils"
import * as ts from "typescript"

export {eslint, ts}

export function returnTypeEquals(
	type: ts.Type,
	flag: ts.TypeFlags
): boolean {
	const call_signatures = type.getCallSignatures()
	if (call_signatures.length === 0) return true

	for (const call_signature of call_signatures) {
		const return_type = call_signature.getReturnType()

		if (return_type.isUnion() || return_type.flags !== flag) return false
	}

	return true
}

export function getType(
	node: eslint.TSESTree.Node,
	checker: ts.TypeChecker,
	services: eslint.ParserServices,
): ts.Type {
	return checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(node))
}
