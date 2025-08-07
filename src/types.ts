import { IEqualsComparer } from 'mobx';
import { Annotation, AnnotationsMap } from 'mobx/dist/internal';

// ========================== MOBX STATE ==============================

export type MobxStateWithGetterAndSetter<K, T> = { [Value in Extract<K, string>]: T } & SetterType<K, T>;
export type SetterType<K, T> = { [SetterName in `set${Capitalize<Extract<K, string>>}`]: (newValue: T | ((prev: T) => T)) => void };
export interface MobxStateOptions { reset?: boolean; }
export type MakeObservableOptions = Omit<CreateObservableOptions, 'proxy'>;
export type CreateObservableOptions = { name?: string; equals?: IEqualsComparer<any>; deep?: boolean; defaultDecorator?: Annotation; proxy?: boolean; autoBind?: boolean; };

// ========================== USE VALIDATION ==============================

export type Validator = (value: any, allValues?: Record<string, any>) => true | string;
export type FormValues<T> = { [K in keyof T]: T[K] };
export type FormErrors<T> = { [K in keyof T]: string } & { [K in keyof T as `${K & string}Err`]: string };
export interface SchemaOptions { message?: string; }
export type ValidationResult = { success: boolean; errors: Record<string, string>; };
export interface FormStateOptions {
	instaValidate?: boolean;
	inputResetErr?: boolean;
	validateAllOnChange?: boolean;
	resetErrIfNoValue?: boolean;
	disabled?: boolean;
	observableAnnotations?: AnnotationsMap<{ [key: string]: any; }, never>;
	observableOptions?: MakeObservableOptions;
}

// ========================== USE MOBX UPDATER ==============================

export type Identifiable = { id: string | number; };
type PrevDepth<D extends number> = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10][D];
export type AnyNestedKeyOf<T, Depth extends number = 5> = NestedKeyOf<T, Depth> | string;
export type NestedKeyOf<T, Depth extends number = 5> = [Depth] extends [never]
	? never
	: T extends object
	? {
		[K in keyof T]: K extends string | number
		? T[K] extends (infer U)[]
		? `${K}` | `${K}[${number}]` | `${K}[${number}].${NestedKeyOf<U, PrevDepth<Depth>>}`
		: `${K}` | `${K}.${NestedKeyOf<T[K], PrevDepth<Depth>>}`
		: never
	}[keyof T]
	: never;

export type GetTypeFromKey<T, K extends AnyNestedKeyOf<T>> =
	K extends `${infer Key}.${infer Rest}`
	? Key extends keyof T
	? Rest extends NestedKeyOf<T[Key]>
	? GetTypeFromKey<T[Key], Rest>
	: T[Key]
	: any
	: K extends `${infer Key}[${infer _Index}].${infer Rest}`
	? Key extends keyof T
	? T[Key] extends (infer U)[]
	? Rest extends NestedKeyOf<U>
	? GetTypeFromKey<U, Rest>
	: U
	: any
	: any
	: K extends `${infer Key}[${infer _Index}]`
	? Key extends keyof T
	? T[Key] extends (infer U)[]
	? U
	: any
	: any
	: K extends keyof T
	? T[K]
	: any;

export type UpdaterT<T, K extends AnyNestedKeyOf<T>> =
	| ((prevValue: GetTypeFromKey<T, K>) => GetTypeFromKey<T, K>)
	| GetTypeFromKey<T, K>;

export type MobxUpdateInstance<T extends Identifiable = any> = <K extends NestedKeyOf<T>>(
	id: string | number,
	key: K,
	updater: UpdaterT<T, K>,
	idKey?: string
) => void;

// ========================== MOBX SAI FETCH ==============================

export type MobxSaiInstance<T> = Partial<{
	status: "pending" | "fulfilled" | "rejected";
	data: T | null;
	error: Error | null;

	isPending: boolean;
	isFulfilled: boolean;
	isRejected: boolean;

	options: MobxSaiFetchOptions;

	value: () => T | null;
	errorMessage: () => string | null;
	fetch: (
		promiseOrFunction: Promise<T> | (() => Promise<T>),
		fromWhere?: "fromScroll" | null,
		fetchWhat?: "top" | "bot" | null
	) => MobxSaiInstance<T>;
	setScrollRef: (scrollRef: any) => MobxSaiInstance<T>;
	reset: () => MobxSaiInstance<T>;
}>;


export interface MobxSaiFetchOptions {
	id?: string;
	page?: MobxStateWithGetterAndSetter<number, string> | null;
	pageSetterName?: string | null;
	isFetchUp?: boolean;
	fetchType?: "default" | "pagination";
	fetchIfPending?: boolean;
	fetchIfHaveData?: boolean;
	isSetData?: boolean;
	cacheSystem: Partial<MobxSaiFetchCacheSystemOptions>;
	dataScope: Partial<MobxSaiFetchDataScopeOptions>;
	fetchAddTo: Partial<MobxSaiFetchFetchAddToOptions>;
	needPending?: boolean;
}

export interface MobxSaiFetchCacheSystemOptions {
	limit?: number | null;
	setCache?: null | ((newValue: any[] | ((prev: any[]) => any[])) => void);
}
export interface MobxSaiFetchFetchAddToOptions {
	path?: string | null;
	addTo?: "start" | "end" | "reset";
	isSetReversedArr?: boolean | null;
	isSetPrevArr?: boolean | null;
	setArrCallback?: null | ((newValue: any[] | ((prev: any[]) => any[])) => void);
}

export interface MobxSaiFetchDataScopeOptions {
	class: string | null;
	startFrom: 'bot' | 'top';
	scrollRef?: any;
	onScroll?: (event: any) => void;
	topPercentage: number | null;
	botPercentage: number | null;
	relativeParamsKey: string | null;
	upOrDownParamsKey: string | null;
	isHaveMoreResKey: string | null;
	howMuchGettedToTop: number;
	setParams: null | ((newValue: any[] | ((prev: any[]) => any[])) => void) | any;
}

// ========================== MOBX DEBOUNCER ==============================

export interface DebouncedAction {
	timerId: NodeJS.Timeout;
	pendingActions: Array<() => void>;
}