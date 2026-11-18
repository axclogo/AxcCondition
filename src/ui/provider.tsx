import { createContext, useContext, useMemo, type CSSProperties, type ReactNode } from 'react';
import type { AxcUIComponents } from './types.js';
import { nativeComponents } from './native.js';
import { en, type AxcLocale } from '../core/locale.js';

interface UIContextValue {
	components: AxcUIComponents;
	locale: AxcLocale;
}
// The default is resolved lazily so this module never reads `nativeComponents` while modules are still initializing.
const UIContext = createContext<UIContextValue | null>(null);
const useUIContext = () => useContext(UIContext) ?? { components: nativeComponents, locale: en };

export interface AxcUIProviderProps {
	/** Controls to replace. Unlisted controls are inherited from the outer provider (native by default). */
	components?: Partial<AxcUIComponents>;
	/** UI text, error messages and model prompts. Inherited when omitted; `en` at the top level. */
	locale?: AxcLocale;
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
}

/**
 * Sets controls and locale for every Axc component below it. Nested providers override only what they pass.
 * Renders a `div.axc-ui` wrapper that receives `className` and `style`.
 */
export function AxcUIProvider({ components, locale, children, className, style }: AxcUIProviderProps) {
	const parent = useUIContext();
	const value = useMemo(
		() => ({ components: { ...parent.components, ...components }, locale: locale ?? parent.locale }),
		[parent, components, locale],
	);
	return (
		<UIContext.Provider value={value}>
			<div className={['axc-ui', className].filter(Boolean).join(' ')} style={style}>
				{children}
			</div>
		</UIContext.Provider>
	);
}

export const useAxcComponents = () => useUIContext().components;

/** The active locale. Custom control adapters can use it for their own text. */
export const useAxcLocale = () => useUIContext().locale;
