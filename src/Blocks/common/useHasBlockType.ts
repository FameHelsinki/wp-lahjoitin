import { useSelect } from '@wordpress/data'
import { store as blockEditorStore } from '@wordpress/block-editor'

export const useHasBlockType = (clientId: any, blockName: string) => {
	return useSelect(
		(select) => {
			const store = select(blockEditorStore) as any
			return store
				.getBlock(clientId)
				.innerBlocks.some(({ name }) => name === blockName)
		},
		[clientId, blockName]
	)
}
