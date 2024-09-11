import * as eslint from "@typescript-eslint/utils"
import * as ts from "typescript"

export {eslint, ts}

export function returnTypeEquals(type: ts.Type, flag: ts.TypeFlags): boolean {
	if (type.flags === ts.TypeFlags.Any) return true

	/* if is an union, check all types */
	if (type.isUnion()) {
		for (const component of type.types) {
			if (!returnTypeEquals(component, flag)) return false
		}
		return true
	}

	const call_signatures = type.getCallSignatures()
	if (call_signatures.length === 0) return false

	for (const call_signature of call_signatures) {
		const return_type = call_signature.getReturnType()

		if (return_type.isUnion() || return_type.flags !== flag) return false
	}

	return true
}
