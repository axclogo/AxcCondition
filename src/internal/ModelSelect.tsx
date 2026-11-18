import type { AxcModelOption } from '../core/types.js';
import { Select } from '../ui/controls.js';
import { useAxcLocale } from '../ui/provider.js';

/** Searchable model picker. `''` in the select maps to `null` (no model chosen). */
export function ModelSelect({
	models,
	value,
	onChange,
	disabled,
	label,
	...link
}: {
	models: AxcModelOption[];
	value: string | null;
	onChange: (value: string | null) => void;
	disabled?: boolean;
	label: string;
	invalid?: boolean;
	describedBy?: string;
}) {
	const locale = useAxcLocale();
	return (
		<Select
			label={label}
			{...link}
			disabled={disabled}
			searchable
			value={value ?? ''}
			onChange={(next) => onChange(next || null)}
			options={[
				{ value: '', label: locale.ui.chooseModel },
				...models.map((model) => ({
					value: model.id,
					label: model.provider ? `${model.provider} / ${model.label}` : model.label,
				})),
			]}
		/>
	);
}
